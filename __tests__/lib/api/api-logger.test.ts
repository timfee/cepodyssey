jest.mock('@/lib/config', () => ({
  config: {
    GOOGLE_API_BASE: 'https://gapi',
    GOOGLE_IDENTITY_BASE: 'https://gid',
    GRAPH_API_BASE: 'https://graph',
    NODE_ENV: 'test',
  },
}))

jest.mock('@/lib/logging/server-logger', () => ({ serverLogger: { log: jest.fn(() => Promise.resolve()) } }))

import { ApiLogger } from '@/lib/api/api-logger'

describe('ApiLogger', () => {
  it('detects provider', () => {
    const logger = new ApiLogger()
    // private method call via any
    const provider = (logger as any).detectProvider('https://gapi/foo')
    expect(provider).toBe('google')
  })

  it('logs requests and errors', async () => {
    const logger = new ApiLogger()
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const reqId = logger.logRequest('https://gapi/test', { method: 'GET' })
    expect(typeof reqId).toBe('string')
    logger.logError(reqId, new Error('fail'))
    expect(logSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })
})
