import { Link, useRouteError } from 'react-router'
import { errorMessage } from '../lib/errors'

/** Pantalla de error en español para cualquier fallo al renderizar una ruta. */
export function RouteError() {
  const error = useRouteError()
  console.error(error)
  const detail = errorMessage(error)
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl text-pimenton">¡Uy!</p>
      <h1 className="mt-4 text-3xl">Algo salió mal</h1>
      <p className="mt-2 text-ink-soft">{detail}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-ghost" onClick={() => window.location.reload()}>
          Recargar
        </button>
        <Link to="/" className="btn-primary">
          Volver a mis recetas
        </Link>
      </div>
    </div>
  )
}
