/** Porciones a mostrar: el parámetro si es un entero ≥ 1; si no, las porciones base. */
export function parseServingsParam(param: string | null, base: number | undefined): number | undefined {
  if (base === undefined) return undefined
  if (param !== null && /^\d+$/.test(param.trim())) {
    const n = Number(param.trim())
    if (n >= 1) return n
  }
  return base
}
