import {
  isAuthenticationError,
  wrapAuthError,
  fetchWithAuth,
  AuthenticationError,
} from '@/lib/api/auth-interceptor'
import { APIError } from '@/lib/api/utils'

jest.mock('@/lib/api/utils', () => {
  const actual = jest.requireActual('@/lib/api/utils')
  return { ...actual, withRetry: jest.fn((fn) => fn()) }
})

describe('auth-interceptor', () => {
  it('identifies auth errors from status', () => {
    const err = new APIError('no token', 401)
    expect(isAuthenticationError(err)).toBe(true)
  })

  it('wraps auth errors with provider', () => {
    const err = new APIError('bad', 401)
    const wrapped = wrapAuthError(err, 'google')
    expect(wrapped).toBeInstanceOf(AuthenticationError)
    expect(wrapped.provider).toBe('google')
  })

  it('fetches with token and logs', async () => {
    const log = {
      logRequest: jest.fn(() => 'id'),
      logResponse: jest.fn(),
      logError: jest.fn(),
    }
    global.fetch = jest.fn(() => Promise.resolve(new Response('{}')))
    const res = await fetchWithAuth(
      'https://g',
      {},
      'google',
      log as unknown as import('@/lib/api/api-logger').ApiLogger,
    )
    expect(global.fetch).toHaveBeenCalled()
    expect(res.ok).toBe(true)
    expect(log.logRequest).toHaveBeenCalled()
    expect(log.logResponse).toHaveBeenCalled()
  })
})
