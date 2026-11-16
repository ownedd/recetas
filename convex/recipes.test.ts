// @vitest-environment edge-runtime
import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

const base = {
  title: 'Tortilla',
  servings: 4,
  ingredients: ['4 huevos', '2 papas'],
  steps: ['Batir.', 'Cuajar.'],
  tags: [] as string[],
}

function setup() {
  const t = convexTest(schema, modules)
  return {
    t,
    ana: t.withIdentity({ tokenIdentifier: 'ana' }),
    beto: t.withIdentity({ tokenIdentifier: 'beto' }),
  }
}

describe('autenticación y validación', () => {
  test('create sin identidad falla', async () => {
    const { t } = setup()
    await expect(t.mutation(api.recipes.create, base)).rejects.toThrow('No autenticado')
  })

  test('create normaliza etiquetas y calcula searchText', async () => {
    const { ana } = setup()
    const id = await ana.mutation(api.recipes.create, { ...base, tags: [' Rápidas', 'rápidas'] })
    const r = await ana.query(api.recipes.get, { id })
    expect(r?.tags).toEqual(['rápidas'])
    expect(r?.favorite).toBe(false)
    expect(r?.searchText).toContain('Tortilla')
    expect(r?.searchText).toContain('4 huevos')
  })

  test('validaciones del servidor', async () => {
    const { ana } = setup()
    await expect(ana.mutation(api.recipes.create, { ...base, title: '  ' })).rejects.toThrow(
      'El título es obligatorio',
    )
    await expect(ana.mutation(api.recipes.create, { ...base, servings: 0 })).rejects.toThrow(
      'Las porciones deben ser un número entero mayor que 0',
    )
    await expect(
      ana.mutation(api.recipes.create, { ...base, sourceUrl: 'javascript:x' }),
    ).rejects.toThrow('La URL debe empezar con http:// o https://')
  })
})

describe('privacidad', () => {
  test('otro usuario no ve ni modifica la receta', async () => {
    const { ana, beto } = setup()
    const id = await ana.mutation(api.recipes.create, base)
    expect(await beto.query(api.recipes.get, { id })).toBeNull()
    expect(await beto.query(api.recipes.list, {})).toEqual([])
    await expect(beto.mutation(api.recipes.update, { id, ...base, title: 'X' })).rejects.toThrow(
      'Receta no encontrada',
    )
    await expect(beto.mutation(api.recipes.remove, { id })).rejects.toThrow('Receta no encontrada')
    await expect(beto.mutation(api.recipes.toggleFavorite, { id })).rejects.toThrow(
      'Receta no encontrada',
    )
  })

  test('id inválido devuelve null', async () => {
    const { ana } = setup()
    expect(await ana.query(api.recipes.get, { id: 'basura' })).toBeNull()
  })
})

describe('listado, búsqueda y etiquetas', () => {
  test('list ordena por actualización y filtra', async () => {
    const { ana } = setup()
    const a = await ana.mutation(api.recipes.create, { ...base, title: 'A', tags: ['rápidas'] })
    await new Promise((r) => setTimeout(r, 5))
    const b = await ana.mutation(api.recipes.create, { ...base, title: 'B' })
    expect((await ana.query(api.recipes.list, {})).map((r) => r._id)).toEqual([b, a])
    expect((await ana.query(api.recipes.list, { tag: 'rápidas' })).map((r) => r._id)).toEqual([a])
    await ana.mutation(api.recipes.toggleFavorite, { id: b })
    const favs = await ana.query(api.recipes.list, { favoritesOnly: true })
    expect(favs.map((r) => r._id)).toEqual([b])
    expect(favs[0].favorite).toBe(true)
  })

  test('search por ingrediente, sin recetas ajenas, con etiqueta', async () => {
    const { ana, beto } = setup()
    const mine = await ana.mutation(api.recipes.create, {
      ...base,
      title: 'Flan',
      ingredients: ['3 huevo'],
      tags: ['postres'],
    })
    await ana.mutation(api.recipes.create, { ...base, title: 'Omelette', ingredients: ['2 huevo'] })
    await beto.mutation(api.recipes.create, { ...base, title: 'Otra', ingredients: ['1 huevo'] })
    const found = await ana.query(api.recipes.search, { query: 'huevo' })
    expect(found.map((r) => r.title).sort()).toEqual(['Flan', 'Omelette'])
    expect(await ana.query(api.recipes.search, { query: '  ' })).toEqual([])
    const tagged = await ana.query(api.recipes.search, { query: 'huevo', tag: 'postres' })
    expect(tagged.map((r) => r._id)).toEqual([mine])
  })

  test('tags cuenta y ordena', async () => {
    const { ana } = setup()
    await ana.mutation(api.recipes.create, { ...base, tags: ['postres'] })
    await ana.mutation(api.recipes.create, { ...base, tags: ['postres', 'rápidas'] })
    expect(await ana.query(api.recipes.tags, {})).toEqual([
      { tag: 'postres', count: 2 },
      { tag: 'rápidas', count: 1 },
    ])
  })
})

describe('fotos', () => {
  test('crear, reemplazar, quitar y borrar', async () => {
    const { t, ana } = setup()
    const store = (type: string) => t.run((ctx) => ctx.storage.store(new Blob(['x'], { type })))
    const img1 = await store('image/jpeg')
    const id = await ana.mutation(api.recipes.create, { ...base, imageId: img1 })
    expect((await ana.query(api.recipes.get, { id }))?.imageUrl).not.toBeNull()

    const img2 = await store('image/webp')
    await ana.mutation(api.recipes.update, { id, ...base, imageId: img2 })
    expect(await t.run((ctx) => ctx.storage.getUrl(img1))).toBeNull()

    await ana.mutation(api.recipes.update, { id, ...base, imageId: null })
    expect((await ana.query(api.recipes.get, { id }))?.imageUrl).toBeNull()
    expect(await t.run((ctx) => ctx.storage.getUrl(img2))).toBeNull()

    const img3 = await store('image/png')
    await ana.mutation(api.recipes.update, { id, ...base, imageId: img3 })
    await ana.mutation(api.recipes.remove, { id })
    expect(await ana.query(api.recipes.get, { id })).toBeNull()
    expect(await t.run((ctx) => ctx.storage.getUrl(img3))).toBeNull()
  })

  test('update sin imageId conserva la foto', async () => {
    const { t, ana } = setup()
    const img = await t.run((ctx) => ctx.storage.store(new Blob(['x'], { type: 'image/jpeg' })))
    const id = await ana.mutation(api.recipes.create, { ...base, imageId: img })
    await ana.mutation(api.recipes.update, { id, ...base, title: 'Nueva' })
    expect((await ana.query(api.recipes.get, { id }))?.imageUrl).not.toBeNull()
  })

  test('archivo que no es imagen se rechaza y no se crea la receta', async () => {
    const { t, ana } = setup()
    const txt = await t.run((ctx) => ctx.storage.store(new Blob(['x'], { type: 'text/plain' })))
    await expect(ana.mutation(api.recipes.create, { ...base, imageId: txt })).rejects.toThrow(
      'La foto debe ser una imagen de hasta 5 MB',
    )
    expect(await ana.query(api.recipes.list, {})).toEqual([])
  })

  test('discardUpload borra un archivo subido', async () => {
    const { t, ana } = setup()
    const txt = await t.run((ctx) => ctx.storage.store(new Blob(['x'], { type: 'text/plain' })))
    await ana.mutation(api.files.discardUpload, { storageId: txt })
    expect(await t.run((ctx) => ctx.storage.getUrl(txt))).toBeNull()
  })

  test('generateUploadUrl requiere sesión', async () => {
    const { t, ana } = setup()
    await expect(t.mutation(api.files.generateUploadUrl, {})).rejects.toThrow('No autenticado')
    expect(typeof (await ana.mutation(api.files.generateUploadUrl, {}))).toBe('string')
  })
})
