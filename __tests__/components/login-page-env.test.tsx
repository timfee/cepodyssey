import { render, screen } from '@testing-library/react'

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('@/lib/config', () => ({
  publicConfig: { NEXT_PUBLIC_ENABLE_API_DEBUG: 'false' },
  config: {},
}))

jest.mock('@/app/(auth)/login/actions', () => ({
  handleGoogleLogin: jest.fn(),
  handleMicrosoftLogin: jest.fn(),
}))

jest.mock('@/app/actions/auth-actions', () => ({
  lookupTenantId: jest.fn(async () => ({ success: false })),
}))

jest.mock('@/app/(auth)/auth', () => ({
  cleanupInvalidSession: jest.fn(),
}))

/**
 * Ensure the login page does not require server-only environment variables.
 */

describe('login page environment', () => {
  it('loads with only public env vars', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LoginPage = require('@/app/(auth)/login/page').default
    render(<LoginPage />)
    expect(screen.getByText(/sign in to get started/i)).toBeInTheDocument()
  })
})
