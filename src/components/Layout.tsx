import { UserButton } from '@clerk/react'
import { Link, Outlet } from 'react-router'
import { Icon } from './Icon'
import { UpdatePrompt } from './UpdatePrompt'

export function Layout() {
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-28 sm:px-6">
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-2.5 text-ink">
          <span className="grid size-10 place-items-center rounded-full bg-pimenton text-card">
            <Icon name="pot" className="size-5" />
          </span>
          <span className="font-display text-2xl">Recetario</span>
        </Link>
        <UserButton />
      </header>
      <UpdatePrompt />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
