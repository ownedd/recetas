import { expect, test } from 'vitest'
import { formatMinutes } from './time'

test('formatMinutes', () => {
  expect(formatMinutes(45)).toBe('45 min')
  expect(formatMinutes(60)).toBe('1 h')
  expect(formatMinutes(90)).toBe('1 h 30 min')
  expect(formatMinutes(undefined)).toBe('')
  expect(formatMinutes(0)).toBe('')
})
