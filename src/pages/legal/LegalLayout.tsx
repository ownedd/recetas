import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'

/** Correo de contacto que aparece en las páginas legales. */
export const CONTACT_EMAIL = 'edgardo2792@gmail.com'
export const UPDATED_AT = '16 de noviembre de 2026'

export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-ink">
          <span className="grid size-10 place-items-center rounded-full bg-pimenton text-card">
            <Icon name="pot" className="size-5" />
          </span>
          <span className="font-display text-2xl">Recetario</span>
        </Link>
      </header>
      <article className="animate-rise space-y-5 leading-relaxed [&_h2]:mt-8 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        <h1 className="text-4xl">{title}</h1>
        <p className="text-sm text-ink-soft">Última actualización: {UPDATED_AT}</p>
        {children}
      </article>
      <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-sm text-ink-soft">
        <Link to="/privacidad" className="underline hover:text-ink">
          Política de privacidad
        </Link>
        <Link to="/terminos" className="underline hover:text-ink">
          Términos del servicio
        </Link>
        <Link to="/" className="underline hover:text-ink">
          Ir a la app
        </Link>
      </footer>
    </div>
  )
}

export function Email() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-pimenton underline">
      {CONTACT_EMAIL}
    </a>
  )
}
