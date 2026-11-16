import { expect, test } from 'vitest'
import { fitWithin } from './image'

test('fitWithin reduce el lado mayor y conserva proporción', () => {
  expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
  expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
})

test('fitWithin no agranda imágenes pequeñas', () => {
  expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
})
