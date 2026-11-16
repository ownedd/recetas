export type Quantity =
  | { kind: 'single'; value: number }
  | { kind: 'range'; min: number; max: number }

export type ParsedIngredient = { quantity: Quantity | null; rest: string; raw: string }

const UNICODE_FRACTIONS: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }
const FRACTION_CHARS: [number, string][] = [
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
]

type NumberRead = { value: number; length: number } | 'invalid' | null

/** Lee un número al inicio de `s`. 'invalid' = parece cantidad pero está malformada. */
function readNumber(s: string): NumberRead {
  let m = /^(\d+)\s+(\d+)\/(\d+)(?![\d/])/.exec(s)
  if (m) {
    const den = Number(m[3])
    if (den === 0) return 'invalid'
    return { value: Number(m[1]) + Number(m[2]) / den, length: m[0].length }
  }
  m = /^(\d+)\/(\d*)/.exec(s)
  if (m) {
    const den = Number(m[2])
    if (m[2] === '' || den === 0) return 'invalid'
    return { value: Number(m[1]) / den, length: m[0].length }
  }
  m = /^(?:(\d+)\s*)?([¼½¾⅓⅔])/.exec(s)
  if (m) {
    return { value: (m[1] ? Number(m[1]) : 0) + UNICODE_FRACTIONS[m[2]], length: m[0].length }
  }
  m = /^(\d+)(?:([.,])(\d+))?/.exec(s)
  if (m) {
    let value: number
    // "1.250" o "1,250" puede ser miles o decimal según el país: no se adivina.
    if (m[2] && m[3].length === 3 && Number(m[1]) > 0) return 'invalid'
    if (m[2]) value = Number(`${m[1]}.${m[3]}`)
    else value = Number(m[1])
    return { value, length: m[0].length }
  }
  return null
}

export function isSectionHeader(line: string): boolean {
  return line.trim().endsWith(':')
}

type FullParse = { quantity: Quantity; start: number; separator: string; end: number }

function parseFull(line: string): FullParse | null {
  const start = line.length - line.trimStart().length
  const first = readNumber(line.slice(start))
  if (first === null || first === 'invalid' || !Number.isFinite(first.value)) return null
  let end = start + first.length
  const sep = /^(\s*[-–]\s*|\s+a\s+)/.exec(line.slice(end))
  if (sep) {
    const second = readNumber(line.slice(end + sep[0].length))
    if (second && second !== 'invalid' && Number.isFinite(second.value)) {
      return {
        quantity: { kind: 'range', min: first.value, max: second.value },
        start,
        separator: sep[0],
        end: end + sep[0].length + second.length,
      }
    }
  }
  return { quantity: { kind: 'single', value: first.value }, start, separator: '', end }
}

export function parseIngredient(line: string): ParsedIngredient {
  const full = isSectionHeader(line) ? null : parseFull(line)
  if (!full) return { quantity: null, rest: line, raw: line }
  return { quantity: full.quantity, rest: line.slice(full.end), raw: line }
}

export function formatQuantity(n: number): string {
  const rounded = Math.round(n)
  if (Math.abs(n - rounded) < 0.01) return String(rounded)
  if (n >= 10) return String(rounded)
  const whole = Math.floor(n)
  const frac = n - whole
  for (const [value, char] of FRACTION_CHARS) {
    if (Math.abs(frac - value) < 0.02) return `${whole > 0 ? whole : ''}${char}`
  }
  return String(Math.round(n * 100) / 100).replace('.', ',')
}

export function scaleIngredient(line: string, factor: number): string {
  if (factor === 1 || !Number.isFinite(factor) || factor <= 0) return line
  const full = isSectionHeader(line) ? null : parseFull(line)
  if (!full) return line
  const prefix = line.slice(0, full.start)
  const rest = line.slice(full.end)
  const q = full.quantity
  const scaled =
    q.kind === 'single'
      ? formatQuantity(q.value * factor)
      : `${formatQuantity(q.min * factor)}${full.separator}${formatQuantity(q.max * factor)}`
  return prefix + scaled + rest
}
