import { APIError } from "@/lib/api/utils"
import { createApiClient } from '@/lib/api/base/api-client'
import "@/lib/api/microsoft/client"
import { wrapAuthError } from '@/lib/api/auth-interceptor'

var passedConfig: any
jest.mock('@/lib/api/base/api-client', () => ({
  createApiClient: jest.fn((cfg) => { passedConfig = cfg; return { get: jest.fn() } })
}))
jest.mock('@/lib/api/auth-interceptor', () => ({ wrapAuthError: jest.fn() }))

describe('microsoftApiClient', () => {
  it("configures handleProviderError that wraps auth errors", () => {
    const err = new APIError("bad", 401)
    try { passedConfig.handleProviderError(err) } catch {}
    expect(wrapAuthError).toHaveBeenCalledWith(err, "microsoft")
  })
})
