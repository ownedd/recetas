import { expect, test } from 'vitest'
import { normalizeIngredients, normalizeSteps } from './normalize'
import { buildSearchText, isHttpUrl, normalizeTags } from '../../convex/lib/recipeText'

test('normalizeIngredients quita viñetas y líneas vacías', () => {
  expect(normalizeIngredients('• 2 huevos\n\n- 2-3 dientes de ajo\n * sal \n')).toEqual(['2 huevos', '2-3 dientes de ajo', 'sal'])
  expect(normalizeIngredients('-2 grados')).toEqual(['-2 grados'])
})

test('normalizeSteps quita numeración', () => {
  expect(normalizeSteps('1. Picar\n2) Sofreír\nPaso 3: Servir')).toEqual(['Picar', 'Sofreír', 'Servir'])
})

test('normalizeSteps une bloques separados por línea vacía', () => {
  expect(normalizeSteps('Picar la cebolla\nmuy fina.\n\nSofreír.')).toEqual(['Picar la cebolla muy fina.', 'Sofreír.'])
  expect(normalizeSteps('a\r\nb')).toEqual(['a', 'b'])
  expect(normalizeSteps('  \n\n ')).toEqual([])
})

test('normalizeTags', () => {
  expect(normalizeTags([' Postres', 'postres', '', 'Comida  rápida'])).toEqual(['postres', 'comida rápida'])
})

test('isHttpUrl', () => {
  expect(isHttpUrl('https://x.com')).toBe(true)
  expect(isHttpUrl('HTTP://x.com')).toBe(true)
  expect(isHttpUrl('javascript:alert(1)')).toBe(false)
})

test('buildSearchText', () => {
  expect(buildSearchText({ title: 'Tortilla', ingredients: ['4 huevos'], tags: ['rápidas'] })).toBe('Tortilla 4 huevos rápidas')
})
