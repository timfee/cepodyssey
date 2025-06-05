import { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
  hasGoogleAuth: true,
  hasMicrosoftAuth: true,
  googleToken: 'mock-google-token',
  microsoftToken: 'mock-microsoft-token',
  microsoftTenantId: 'mock-tenant-id',
  authFlowDomain: 'example.com',
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

export const mockJWT: JWT = {
  sub: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  googleAccessToken: 'mock-google-token',
  googleRefreshToken: 'mock-google-refresh',
  googleExpiresAt: Date.now() + 3600000,
  microsoftAccessToken: 'mock-microsoft-token',
  microsoftRefreshToken: 'mock-microsoft-refresh',
  microsoftExpiresAt: Date.now() + 3600000,
  microsoftTenantId: 'mock-tenant-id',
  authFlowDomain: 'example.com',
}

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(() => Promise.resolve(mockSession)),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
