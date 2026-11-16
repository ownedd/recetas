const BULLET = /^[•\-*·–]\s+/
const STEP_NUMBER = /^(paso\s+\d+\s*[:.)-]?|\d+\s*[.)])\s*/i

function lines(text: string): string[] {
  return text.replace(/\r\n?/g, '\n').split('\n')
}

export function normalizeIngredients(text: string): string[] {
  return lines(text)
    .map((l) => l.trim().replace(BULLET, '').trim())
    .filter(Boolean)
}

function cleanStep(s: string): string {
  return s.trim().replace(BULLET, '').replace(STEP_NUMBER, '').trim()
}

export function normalizeSteps(text: string): string[] {
  const t = text.replace(/\r\n?/g, '\n')
  const chunks = /\n\s*\n/.test(t)
    ? t.split(/\n\s*\n/).map((block) =>
        block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .join(' '),
      )
    : lines(t)
  return chunks.map(cleanStep).filter(Boolean)
}
