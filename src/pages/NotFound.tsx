import { Link } from 'react-router'

export function NotFound({ message = 'Esta página no existe' }: { message?: string }) {
  return (
    <div className="animate-rise py-20 text-center">
      <p className="font-display text-6xl text-pimenton">¡Ups!</p>
      <h1 className="mt-4 text-2xl">{message}</h1>
      <Link to="/" className="btn-primary mt-8">
        Volver a mis recetas
      </Link>
    </div>
  )
}
