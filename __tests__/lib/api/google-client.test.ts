jest.mock('@/lib/api/base/api-client', () => ({
  createApiClient: jest.fn((cfg) => { global.cfg = cfg; return {}; })
}))

jest.mock('@/lib/api/auth-interceptor', () => ({ wrapAuthError: jest.fn() }))

jest.mock('@/lib/api/api-enablement-error', () => ({
  isAPIEnablementError: jest.fn(() => true),
  createEnablementError: jest.fn((e) => new Error('enable ' + e.message)),
}))

import '@/lib/api/google/client'
import { APIError } from '@/lib/api/utils'
import { wrapAuthError } from '@/lib/api/auth-interceptor'
import { createEnablementError } from '@/lib/api/api-enablement-error'

const passed = (global as { cfg: { handleProviderError: (e: unknown) => void } }).cfg

describe('googleApiClient handleProviderError', () => {
  it('wraps auth and enable errors', () => {
    const err = new APIError('bad', 401)
    expect(() => passed.handleProviderError(err)).toThrowError()
    expect(wrapAuthError).toHaveBeenCalled()
  })

  it('handles enablement error', () => {
    const err = new APIError('not enabled', 403)
    try { passed.handleProviderError(err) } catch {}
    expect(createEnablementError).toHaveBeenCalledWith(err)
  })
})
