import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { ServingsStepper } from './ServingsStepper'

test('con 1 porción el botón − está deshabilitado', () => {
  render(<ServingsStepper value={1} onChange={() => {}} />)
  expect(screen.getByRole('button', { name: 'Menos porciones' })).toBeDisabled()
})

test('+ suma una porción', () => {
  const onChange = vi.fn()
  render(<ServingsStepper value={1} onChange={onChange} />)
  fireEvent.click(screen.getByRole('button', { name: 'Más porciones' }))
  expect(onChange).toHaveBeenCalledWith(2)
})
