// Funciones puras compartidas entre el servidor (Convex) y el cliente.

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of tags) {
    const t = tag.trim().toLowerCase().replace(/\s+/g, ' ')
    if (t && !seen.has(t)) {
      seen.add(t)
      out.push(t)
    }
  }
  return out
}

export function buildSearchText(r: { title: string; ingredients: string[]; tags: string[] }): string {
  return [r.title, ...r.ingredients, ...r.tags].join(' ')
}

export function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim())
}
