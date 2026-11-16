import { expect, test } from 'vitest'
import { cookingReducer, type CookingState } from './cooking'

const start: CookingState = { checked: [], current: 0 }

test('toggle marca y desmarca un ingrediente', () => {
  const s1 = cookingReducer(start, { type: 'toggle', index: 2 })
  expect(s1.checked).toEqual([2])
  expect(cookingReducer(s1, { type: 'toggle', index: 2 }).checked).toEqual([])
})

test('next no pasa del último paso', () => {
  const last = { checked: [], current: 2 }
  expect(cookingReducer(last, { type: 'next', stepCount: 3 }).current).toBe(2)
  expect(cookingReducer(start, { type: 'next', stepCount: 3 }).current).toBe(1)
})

test('prev no baja de 0', () => {
  expect(cookingReducer(start, { type: 'prev' }).current).toBe(0)
})

test('goto se acota al rango', () => {
  expect(cookingReducer(start, { type: 'goto', index: 9, stepCount: 3 }).current).toBe(2)
  expect(cookingReducer(start, { type: 'goto', index: -4, stepCount: 3 }).current).toBe(0)
  expect(cookingReducer(start, { type: 'goto', index: 1, stepCount: 3 }).current).toBe(1)
})
