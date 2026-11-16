import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '../components/Icon'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="animate-rise text-center">
        <span className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-pimenton text-card shadow-card">
          <Icon name="pot" className="size-8" />
        </span>
        <h1 className="text-4xl">Recetario</h1>
        <p className="mt-2 text-ink-soft">Tus recetas, en cualquier cocina.</p>
      </div>
      <div className="animate-rise [animation-delay:120ms]">{children}</div>
      <nav className="flex gap-5 text-sm text-ink-soft">
        <Link to="/privacidad" className="underline hover:text-ink">
          Privacidad
        </Link>
        <Link to="/terminos" className="underline hover:text-ink">
          Términos
        </Link>
      </nav>
    </div>
  )
}
