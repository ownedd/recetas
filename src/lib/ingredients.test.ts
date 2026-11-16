import { describe, expect, test } from 'vitest'
import { formatQuantity, isSectionHeader, parseIngredient, scaleIngredient } from './ingredients'

describe('parseIngredient', () => {
  test('entero con resto literal', () => {
    expect(parseIngredient('500 g carne').quantity).toEqual({ kind: 'single', value: 500 })
    expect(parseIngredient('500 g carne').rest).toBe(' g carne')
    expect(parseIngredient('500 g carne').raw).toBe('500 g carne')
  })
  test('fracciones', () => {
    expect(parseIngredient('1/2 taza').quantity).toEqual({ kind: 'single', value: 0.5 })
    expect(parseIngredient('1 1/2 tazas').quantity).toEqual({ kind: 'single', value: 1.5 })
  })
  test('fracciones unicode', () => {
    expect(parseIngredient('½ cebolla').quantity).toEqual({ kind: 'single', value: 0.5 })
    expect(parseIngredient('1½ tazas').quantity).toEqual({ kind: 'single', value: 1.5 })
  })
  test('decimales y miles', () => {
    expect(parseIngredient('0,5 kg').quantity).toEqual({ kind: 'single', value: 0.5 })
    expect(parseIngredient('1.5 l').quantity).toEqual({ kind: 'single', value: 1.5 })
  })
  test('rangos', () => {
    expect(parseIngredient('2-3 dientes').quantity).toEqual({ kind: 'range', min: 2, max: 3 })
    expect(parseIngredient('2 a 3 dientes').quantity).toEqual({ kind: 'range', min: 2, max: 3 })
  })
  test('sin cantidad', () => {
    expect(parseIngredient('sal al gusto').quantity).toBeNull()
    expect(parseIngredient('una taza de leche').quantity).toBeNull()
  })
  test('cantidades malformadas', () => {
    expect(parseIngredient('1/0 taza').quantity).toBeNull()
    expect(parseIngredient('1/ taza').quantity).toBeNull()
  })
})

describe('isSectionHeader', () => {
  test('línea que termina en dos puntos', () => {
    expect(isSectionHeader('Para la salsa:')).toBe(true)
    expect(isSectionHeader('  Para la salsa:  ')).toBe(true)
    expect(isSectionHeader('2 huevos')).toBe(false)
  })
})

describe('formatQuantity', () => {
  test('formatos', () => {
    expect(formatQuantity(2)).toBe('2')
    expect(formatQuantity(0.5)).toBe('½')
    expect(formatQuantity(1.5)).toBe('1½')
    expect(formatQuantity(1 / 3)).toBe('⅓')
    expect(formatQuantity(0.75)).toBe('¾')
    expect(formatQuantity(0.4)).toBe('0,4')
    expect(formatQuantity(33.333)).toBe('33')
    expect(formatQuantity(2.125)).toBe('2,13')
  })
})

describe('scaleIngredient', () => {
  test('escala cantidades', () => {
    expect(scaleIngredient('500 g carne', 0.5)).toBe('250 g carne')
    expect(scaleIngredient('1 cebolla', 0.5)).toBe('½ cebolla')
    expect(scaleIngredient('3 huevos', 0.5)).toBe('1½ huevos')
  })
  test('rangos conservan separador', () => {
    expect(scaleIngredient('2-3 dientes de ajo', 2)).toBe('4-6 dientes de ajo')
    expect(scaleIngredient('2 a 3 dientes', 2)).toBe('4 a 6 dientes')
  })
  test('líneas que no se tocan', () => {
    expect(scaleIngredient('sal al gusto', 2)).toBe('sal al gusto')
    expect(scaleIngredient('Para la salsa:', 2)).toBe('Para la salsa:')
    expect(scaleIngredient('1/0 taza', 2)).toBe('1/0 taza')
    expect(scaleIngredient('500 g carne', 1)).toBe('500 g carne')
  })
})

describe('revisión final', () => {
  test('entero + espacio + fracción unicode', () => {
    expect(parseIngredient('1 ½ taza').quantity).toEqual({ kind: 'single', value: 1.5 })
    expect(scaleIngredient('1 ½ taza', 2)).toBe('3 taza')
    expect(scaleIngredient('2 ½ tazas', 0.5)).toBe('1¼ tazas')
  })
  test('0.250 es decimal, no miles', () => {
    expect(parseIngredient('0.250 kg').quantity).toEqual({ kind: 'single', value: 0.25 })
    expect(scaleIngredient('0.250 kg', 2)).toBe('½ kg')
    expect(parseIngredient('0,250 kg').quantity).toEqual({ kind: 'single', value: 0.25 })
  })
  test('N.ddd / N,ddd ambiguo (miles o decimal) no se escala', () => {
    expect(parseIngredient('1.250 kg').quantity).toBeNull()
    expect(parseIngredient('1,250 kg').quantity).toBeNull()
    expect(scaleIngredient('1.000 g harina', 2)).toBe('1.000 g harina')
  })
})
