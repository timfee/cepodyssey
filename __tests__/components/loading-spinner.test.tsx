/// <reference types="@testing-library/jest-dom" />
import { render } from '@testing-library/react'
import { LoadingSpinner } from '@/components/loading-spinner'

it('renders spinner only when not fullScreen', () => {
  const { container } = render(<LoadingSpinner />)
  expect(container.querySelector('svg')).toBeInTheDocument()
  expect(container.querySelector('div')).not.toBeInTheDocument()
})

it('wraps spinner when fullScreen', () => {
  const { container } = render(<LoadingSpinner fullScreen />)
  const wrapper = container.querySelector('div')
  expect(wrapper).toHaveClass('flex')
  expect(wrapper?.querySelector('svg')).toBeInTheDocument()
})
