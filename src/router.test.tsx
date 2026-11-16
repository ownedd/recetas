import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, test } from 'vitest'
import { routes } from './router'

// Sin ConvexProvider ni ClerkProvider: si estas rutas estuvieran detrás del login, fallarían.
function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

test('/privacidad es pública', async () => {
  renderAt('/privacidad')
  expect(await screen.findByRole('heading', { level: 1, name: 'Política de privacidad' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Términos del servicio' })).toHaveAttribute('href', '/terminos')
})

test('/terminos es pública', async () => {
  renderAt('/terminos')
  expect(await screen.findByRole('heading', { level: 1, name: 'Términos del servicio' })).toBeInTheDocument()
  for (const link of screen.getAllByRole('link', { name: 'Política de privacidad' })) {
    expect(link).toHaveAttribute('href', '/privacidad')
  }
})
