import { createApiClient } from '@/lib/api/base/api-client'
import { fetchWithAuth } from '@/lib/api/auth-interceptor'
import { handleApiResponse, APIError } from '@/lib/api/utils'

jest.mock('@/lib/api/auth-interceptor', () => ({ fetchWithAuth: jest.fn() }))
jest.mock('@/lib/api/utils', () => ({
  ...jest.requireActual('@/lib/api/utils'),
  handleApiResponse: jest.fn(),
}))

const handleProviderError = jest.fn()

const makeClient = () =>
  createApiClient({
    provider: 'google',
    getToken: jest.fn(),
    handleProviderError,
  })

const response = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'application/json' } })

describe('createApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('performs request and parses json', async () => {
    ;(fetchWithAuth as jest.Mock).mockResolvedValue(response('{"a":1}'))
    ;(handleApiResponse as jest.Mock).mockResolvedValue({ a: 1 })
    const client = makeClient()
    const result = await client.request('/foo')
    expect(fetchWithAuth).toHaveBeenCalledWith(
      '/foo',
      { method: 'GET', body: undefined, headers: { 'Content-Type': 'application/json' } },
      'google',
      undefined,
    )
    expect(handleApiResponse).toHaveBeenCalled()
    expect(result).toEqual({ a: 1 })
  })

  it('returns text when responseType="text"', async () => {
    ;(fetchWithAuth as jest.Mock).mockResolvedValue(response('hello'))
    const client = makeClient()
    const result = await client.request('/txt', { responseType: 'text' })
    expect(result).toBe('hello')
  })

  it('delegates errors to handleProviderError', async () => {
    const error = new APIError('bad', 500)
    ;(fetchWithAuth as jest.Mock).mockRejectedValue(error)
    const client = makeClient()
    await client.request('/err').catch(() => undefined)
    expect(handleProviderError).toHaveBeenCalledWith(error)
  })
  it('exposes http verb helpers', async () => {
    ;(fetchWithAuth as jest.Mock).mockResolvedValue(response('{"x":1}'))
    ;(handleApiResponse as jest.Mock).mockResolvedValue({ x: 1 })
    const client = makeClient()
    await client.post('/p', { a: 1 })
    await client.patch('/pa', { b: 1 })
    await client.put('/pu', { c: 1 })
    expect(fetchWithAuth).toHaveBeenCalledTimes(3)
  })
})
