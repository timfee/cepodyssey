/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent } from '@testing-library/react'
import { GlobalErrorModal } from '@/components/global-error-modal'

jest.mock('@/hooks/use-redux', () => ({
  useAppDispatch: () => jest.fn(),
  useAppSelector: (sel: (state: typeof mockState) => unknown) => sel(mockState),
}))

jest.mock('next-auth/react', () => ({ signOut: jest.fn() }))
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

const mockState = {
  ui: {
    error: { message: 'oh no', details: {} },
    hasError: true,
  },
}


it('renders and dismisses generic error', () => {
  const { queryByRole } = render(<GlobalErrorModal />)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
  expect(queryByRole('dialog')).toBeInTheDocument()
})
