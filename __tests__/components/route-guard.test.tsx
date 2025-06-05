/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react'
import { RouteGuard } from '@/components/route-guard'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/components/loading-spinner', () => ({
  LoadingSpinner: ({ fullScreen }: { fullScreen?: boolean }) => (
    <div data-testid="spinner">{fullScreen ? 'full' : 'partial'}</div>
  ),
}))

describe('RouteGuard', () => {
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ replace: jest.fn() })
  })

  it('shows spinner while loading', () => {
    mockUseSession.mockReturnValue({ status: 'loading' })
    render(
      <RouteGuard>
        <div>secret</div>
      </RouteGuard>,
    )
    expect(screen.getByTestId('spinner')).toHaveTextContent('full')
  })

  it('redirects when unauthenticated', () => {
    const replace = jest.fn()
    mockUseRouter.mockReturnValue({ replace })
    mockUseSession.mockReturnValue({ status: 'unauthenticated' })
    render(
      <RouteGuard>
        <div>secret</div>
      </RouteGuard>,
    )
    expect(replace).toHaveBeenCalledWith('/login?reason=unauthenticated')
  })

  it('shows children when authenticated', () => {
    mockUseSession.mockReturnValue({ status: 'authenticated' })
    render(
      <RouteGuard>
        <div>secret</div>
      </RouteGuard>,
    )
    expect(screen.getByText('secret')).toBeInTheDocument()
    expect(screen.queryByTestId('spinner')).toBeNull()
  })
})
