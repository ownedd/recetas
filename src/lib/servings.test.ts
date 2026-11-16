import { expect, test } from 'vitest'
import { parseServingsParam } from './servings'

test('parseServingsParam', () => {
  expect(parseServingsParam('2', 4)).toBe(2)
  expect(parseServingsParam(null, 4)).toBe(4)
  expect(parseServingsParam('abc', 4)).toBe(4)
  expect(parseServingsParam('0', 4)).toBe(4)
  expect(parseServingsParam('2.5', 4)).toBe(4)
  expect(parseServingsParam('2', undefined)).toBeUndefined()
})
