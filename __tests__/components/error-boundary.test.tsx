/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/error-boundary'

it('renders message and calls reset', () => {
  const reset = jest.fn()
  const err = new Error('boom')
  jest.spyOn(console, 'error').mockImplementation(() => {})
  render(<ErrorBoundary error={err} reset={reset} />)
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button'))
  expect(reset).toHaveBeenCalled()
})
