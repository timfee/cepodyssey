/// <reference types="@testing-library/jest-dom" />
import { renderWithProviders } from '@/test/utils/render'
import { fireEvent } from '@testing-library/react'
import { AuthStatus } from '@/components/auth'
import { useAppSelector } from '@/hooks/use-redux'
import { useSession, signIn } from 'next-auth/react'
import { useErrorHandler } from '@/hooks/use-error-handler'

jest.mock('@/hooks/use-redux')
jest.mock('next-auth/react', () => ({
  __esModule: true,
  signIn: jest.fn(),
  useSession: jest.fn(),
}))
jest.mock('@/hooks/use-error-handler')

const selector = useAppSelector as jest.Mock
const mockSession = useSession as jest.Mock
const mockSignIn = signIn as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('AuthStatus', () => {
  it('connects provider when configuration is ready', () => {
    selector.mockImplementation((sel) => sel({ app: { domain: 'ex.com', tenantId: 'tid' } }))
    mockSession.mockReturnValue({ data: { hasGoogleAuth: false }, status: 'authenticated' })
    ;(useErrorHandler as jest.Mock).mockReturnValue({ handleError: jest.fn() })
    const { getAllByRole } = renderWithProviders(<AuthStatus />)
    fireEvent.click(getAllByRole('button', { name: /connect/i })[0])
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/' }, { hd: 'ex.com' })
  })

})
