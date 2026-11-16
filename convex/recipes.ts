import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import { requireUserId } from './lib/auth'
import { buildSearchText, isHttpUrl, normalizeTags } from './lib/recipeText'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const recipeFields = {
  title: v.string(),
  description: v.optional(v.string()),
  servings: v.optional(v.number()),
  prepMinutes: v.optional(v.number()),
  cookMinutes: v.optional(v.number()),
  ingredients: v.array(v.string()),
  steps: v.array(v.string()),
  tags: v.array(v.string()),
  notes: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
}

type RecipeFields = {
  title: string
  description?: string
  servings?: number
  prepMinutes?: number
  cookMinutes?: number
  ingredients: string[]
  steps: string[]
  tags: string[]
  notes?: string
  sourceUrl?: string
}

export type RecipeSummary = {
  _id: Id<'recipes'>
  title: string
  imageUrl: string | null
  prepMinutes?: number
  cookMinutes?: number
  tags: string[]
  favorite: boolean
}

const isNonNegativeInt = (n: number) => Number.isInteger(n) && n >= 0

/** Valida y normaliza los campos editables; lanza ConvexError con mensajes en español. */
function cleanFields(f: RecipeFields) {
  const title = f.title.trim()
  if (!title) throw new ConvexError('El título es obligatorio')
  if (f.servings !== undefined && !(Number.isInteger(f.servings) && f.servings >= 1)) {
    throw new ConvexError('Las porciones deben ser un número entero mayor que 0')
  }
  for (const m of [f.prepMinutes, f.cookMinutes]) {
    if (m !== undefined && !isNonNegativeInt(m)) throw new ConvexError('Debe ser un número entero de minutos')
  }
  const sourceUrl = f.sourceUrl?.trim() || undefined
  if (sourceUrl && !isHttpUrl(sourceUrl)) throw new ConvexError('La URL debe empezar con http:// o https://')
  const ingredients = f.ingredients.map((s) => s.trim()).filter(Boolean)
  const steps = f.steps.map((s) => s.trim()).filter(Boolean)
  const tags = normalizeTags(f.tags)
  return {
    title,
    description: f.description?.trim() || undefined,
    servings: f.servings,
    prepMinutes: f.prepMinutes,
    cookMinutes: f.cookMinutes,
    ingredients,
    steps,
    tags,
    notes: f.notes?.trim() || undefined,
    sourceUrl,
    searchText: buildSearchText({ title, ingredients, tags }),
    updatedAt: Date.now(),
  }
}

async function validateImage(ctx: MutationCtx, imageId: Id<'_storage'>) {
  const meta = await ctx.db.system.get(imageId)
  if (!meta || !meta.contentType?.startsWith('image/') || meta.size > MAX_IMAGE_BYTES) {
    // Nota: no se borra aquí porque el error revierte la transacción;
    // el cliente llama a files.discardUpload si el guardado falla.
    throw new ConvexError('La foto debe ser una imagen de hasta 5 MB')
  }
}

async function getOwned(ctx: MutationCtx, id: Id<'recipes'>, userId: string) {
  const recipe = await ctx.db.get(id)
  if (!recipe || recipe.userId !== userId) throw new ConvexError('Receta no encontrada')
  return recipe
}

async function toSummary(ctx: QueryCtx, r: Doc<'recipes'>): Promise<RecipeSummary> {
  return {
    _id: r._id,
    title: r.title,
    imageUrl: r.imageId ? await ctx.storage.getUrl(r.imageId) : null,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    tags: r.tags,
    favorite: r.favorite,
  }
}

export const list = query({
  args: { tag: v.optional(v.string()), favoritesOnly: v.optional(v.boolean()) },
  handler: async (ctx, { tag, favoritesOnly }) => {
    const userId = await requireUserId(ctx)
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_user_updated', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
    const filtered = recipes.filter(
      (r) => (!tag || r.tags.includes(tag)) && (!favoritesOnly || r.favorite),
    )
    return Promise.all(filtered.map((r) => toSummary(ctx, r)))
  },
})

export const search = query({
  args: { query: v.string(), tag: v.optional(v.string()) },
  handler: async (ctx, { query: text, tag }) => {
    const userId = await requireUserId(ctx)
    if (!text.trim()) return []
    const results = await ctx.db
      .query('recipes')
      .withSearchIndex('search_text', (q) => q.search('searchText', text).eq('userId', userId))
      .take(50)
    const filtered = results.filter((r) => !tag || r.tags.includes(tag))
    return Promise.all(filtered.map((r) => toSummary(ctx, r)))
  },
})

export const get = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx)
    const recipeId = ctx.db.normalizeId('recipes', id)
    if (!recipeId) return null
    const recipe = await ctx.db.get(recipeId)
    if (!recipe || recipe.userId !== userId) return null
    return {
      ...recipe,
      imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null,
    }
  },
})

export const tags = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const recipes = await ctx.db
      .query('recipes')
      .withIndex('by_user_updated', (q) => q.eq('userId', userId))
      .collect()
    const counts = new Map<string, number>()
    for (const r of recipes) for (const t of r.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    return [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'es'))
  },
})

export const create = mutation({
  args: { ...recipeFields, imageId: v.optional(v.id('_storage')) },
  handler: async (ctx, { imageId, ...fields }) => {
    const userId = await requireUserId(ctx)
    const clean = cleanFields(fields)
    if (imageId) await validateImage(ctx, imageId)
    return await ctx.db.insert('recipes', { ...clean, userId, imageId, favorite: false })
  },
})

export const update = mutation({
  args: {
    id: v.id('recipes'),
    ...recipeFields,
    imageId: v.optional(v.union(v.id('_storage'), v.null())),
  },
  handler: async (ctx, { id, imageId, ...fields }) => {
    const userId = await requireUserId(ctx)
    const recipe = await getOwned(ctx, id, userId)
    const clean = cleanFields(fields)
    let nextImage = recipe.imageId
    if (imageId !== undefined && imageId !== recipe.imageId) {
      if (imageId !== null) await validateImage(ctx, imageId)
      if (recipe.imageId) await ctx.storage.delete(recipe.imageId)
      nextImage = imageId ?? undefined
    }
    await ctx.db.replace(id, {
      ...clean,
      userId,
      imageId: nextImage,
      favorite: recipe.favorite,
    })
    return null
  },
})

export const toggleFavorite = mutation({
  args: { id: v.id('recipes') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx)
    const recipe = await getOwned(ctx, id, userId)
    await ctx.db.patch(id, { favorite: !recipe.favorite })
    return null
  },
})

export const remove = mutation({
  args: { id: v.id('recipes') },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx)
    const recipe = await getOwned(ctx, id, userId)
    if (recipe.imageId) await ctx.storage.delete(recipe.imageId)
    await ctx.db.delete(id)
    return null
  },
})
