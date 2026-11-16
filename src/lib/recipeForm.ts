import { isHttpUrl, normalizeTags } from '../../convex/lib/recipeText'
import { normalizeIngredients, normalizeSteps } from './normalize'

export type RecipeInput = {
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

export type RecipeFormValues = {
  title: string
  description: string
  servings: string
  prepMinutes: string
  cookMinutes: string
  ingredientsText: string
  stepsText: string
  tags: string[]
  notes: string
  sourceUrl: string
}

export type FormErrors = Partial<Record<keyof RecipeFormValues, string>>

export const emptyForm: RecipeFormValues = {
  title: '',
  description: '',
  servings: '',
  prepMinutes: '',
  cookMinutes: '',
  ingredientsText: '',
  stepsText: '',
  tags: [],
  notes: '',
  sourceUrl: '',
}

export function recipeToForm(r: RecipeInput): RecipeFormValues {
  return {
    title: r.title,
    description: r.description ?? '',
    servings: r.servings?.toString() ?? '',
    prepMinutes: r.prepMinutes?.toString() ?? '',
    cookMinutes: r.cookMinutes?.toString() ?? '',
    ingredientsText: r.ingredients.join('\n'),
    stepsText: r.steps.join('\n\n'),
    tags: [...r.tags],
    notes: r.notes ?? '',
    sourceUrl: r.sourceUrl ?? '',
  }
}

const optionalText = (s: string) => (s.trim() ? s.trim() : undefined)

/** Entero opcional; devuelve 'error' si hay texto que no cumple `min`. */
function optionalInt(s: string, min: number): number | undefined | 'error' {
  const t = s.trim()
  if (!t) return undefined
  if (!/^-?\d+$/.test(t)) return 'error'
  const n = Number(t)
  return n >= min ? n : 'error'
}

export function formToInput(
  v: RecipeFormValues,
): { ok: true; input: RecipeInput } | { ok: false; errors: FormErrors } {
  const errors: FormErrors = {}
  const title = v.title.trim()
  if (!title) errors.title = 'El título es obligatorio'
  const servings = optionalInt(v.servings, 1)
  if (servings === 'error') errors.servings = 'Las porciones deben ser un número entero mayor que 0'
  const prepMinutes = optionalInt(v.prepMinutes, 0)
  if (prepMinutes === 'error') errors.prepMinutes = 'Debe ser un número entero de minutos'
  const cookMinutes = optionalInt(v.cookMinutes, 0)
  if (cookMinutes === 'error') errors.cookMinutes = 'Debe ser un número entero de minutos'
  const sourceUrl = optionalText(v.sourceUrl)
  if (sourceUrl && !isHttpUrl(sourceUrl)) errors.sourceUrl = 'La URL debe empezar con http:// o https://'
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const input: RecipeInput = {
    title,
    ingredients: normalizeIngredients(v.ingredientsText),
    steps: normalizeSteps(v.stepsText),
    tags: normalizeTags(v.tags),
  }
  const description = optionalText(v.description)
  if (description) input.description = description
  if (typeof servings === 'number') input.servings = servings
  if (typeof prepMinutes === 'number') input.prepMinutes = prepMinutes
  if (typeof cookMinutes === 'number') input.cookMinutes = cookMinutes
  const notes = optionalText(v.notes)
  if (notes) input.notes = notes
  if (sourceUrl) input.sourceUrl = sourceUrl
  return { ok: true, input }
}
