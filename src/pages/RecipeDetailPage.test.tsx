import { fireEvent, render, screen } from '@testing-library/react'
import { useMutation, useQuery } from 'convex/react'
import { getFunctionName } from 'convex/server'
import { ConvexError } from 'convex/values'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, expect, test, vi } from 'vitest'
import { RecipeDetailPage } from './RecipeDetailPage'

vi.mock('convex/react', () => ({ useQuery: vi.fn(), useMutation: vi.fn() }))

const recipe = {
  _id: 'r1',
  title: 'Flan',
  servings: 4,
  ingredients: ['4 huevos'],
  steps: ['Batir.'],
  tags: [],
  favorite: false,
  imageUrl: null,
}

const toggle = vi.fn()
const remove = vi.fn()

beforeEach(() => {
  toggle.mockReset()
  remove.mockReset()
  vi.mocked(useQuery).mockReturnValue(recipe)
  vi.mocked(useMutation).mockImplementation(((ref: Parameters<typeof getFunctionName>[0]) =>
    getFunctionName(ref) === 'recipes:toggleFavorite' ? toggle : remove) as unknown as typeof useMutation)
})

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/receta/:id', element: <RecipeDetailPage /> },
      { path: '/', element: <p>Lista</p> },
    ],
    { initialEntries: ['/receta/r1'] },
  )
  render(<RouterProvider router={router} />)
  return router
}

test('si marcar favorita falla, se avisa', async () => {
  toggle.mockRejectedValue(new ConvexError('Receta no encontrada'))
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Marcar como favorita' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Receta no encontrada')
})

test('si borrar falla, se queda en la receta y avisa', async () => {
  remove.mockRejectedValue(new Error('offline'))
  const router = renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Borrar receta' }))
  fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Algo salió mal. Inténtalo de nuevo.')
  expect(router.state.location.pathname).toBe('/receta/r1')
})

test('si borrar funciona, vuelve a la lista', async () => {
  remove.mockResolvedValue(null)
  renderPage()
  fireEvent.click(screen.getByRole('button', { name: 'Borrar receta' }))
  fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
  expect(await screen.findByText('Lista')).toBeInTheDocument()
})
