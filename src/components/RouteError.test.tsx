import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, test, vi } from 'vitest'
import { RouteError } from './RouteError'

function Boom(): never {
  throw new Error('fallo del servidor')
}

test('un error al renderizar muestra un mensaje en español con salida', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const router = createMemoryRouter([{ path: '/', element: <Boom />, errorElement: <RouteError /> }])
  render(<RouterProvider router={router} />)
  expect(await screen.findByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver a mis recetas' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument()
})
