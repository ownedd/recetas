import { expect, test } from 'vitest'
import { emptyForm, formToInput, recipeToForm } from './recipeForm'

test('ida y vuelta sin pérdidas', () => {
  const r = { title: 'Tortilla', servings: 4, ingredients: ['4 huevos', 'Para la salsa:'], steps: ['Batir.', 'Cuajar.'], tags: ['rápidas'] }
  expect(formToInput(recipeToForm(r))).toEqual({ ok: true, input: r })
})

test('errores de validación', () => {
  expect(formToInput({ ...emptyForm, title: '  ' })).toMatchObject({ ok: false, errors: { title: 'El título es obligatorio' } })
  expect(formToInput({ ...emptyForm, title: 'x', servings: '0' })).toMatchObject({ ok: false, errors: { servings: 'Las porciones deben ser un número entero mayor que 0' } })
  expect(formToInput({ ...emptyForm, title: 'x', prepMinutes: '-5' })).toMatchObject({ ok: false, errors: { prepMinutes: 'Debe ser un número entero de minutos' } })
  expect(formToInput({ ...emptyForm, title: 'x', sourceUrl: 'javascript:alert(1)' })).toMatchObject({ ok: false, errors: { sourceUrl: 'La URL debe empezar con http:// o https://' } })
})

test('normaliza ingredientes, pasos y etiquetas al guardar', () => {
  const res = formToInput({ ...emptyForm, title: ' Pan ', ingredientsText: '- 500 g harina\n\n', stepsText: '1. Amasar\n2. Hornear', tags: ['Panes'] })
  expect(res).toEqual({ ok: true, input: { title: 'Pan', ingredients: ['500 g harina'], steps: ['Amasar', 'Hornear'], tags: ['panes'] } })
})
