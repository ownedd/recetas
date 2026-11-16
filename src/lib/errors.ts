import { ConvexError } from 'convex/values'

/** Mensaje legible para el usuario a partir de un error de Convex o del navegador. */
export function errorMessage(e: unknown): string {
  if (e instanceof ConvexError && typeof e.data === 'string') return e.data
  if (e instanceof Error && e.message === 'No se pudo leer la imagen') return e.message
  return 'Algo salió mal. Inténtalo de nuevo.'
}
