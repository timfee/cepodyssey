import { serverLogger } from '@/lib/logging/server-logger'

jest.mock('@/lib/config', () => ({ config: { NODE_ENV: 'test' } }))

const cookieStore = {
  data: new Map<string, string>(),
  get: (name: string) => {
    const value = cookieStore.data.get(name)
    return value ? { value } : undefined
  },
  set: (name: string, value: string) => {
    cookieStore.data.set(name, value)
  },
}

jest.mock('next/headers', () => ({ cookies: () => cookieStore }))

describe('serverLogger', () => {
  beforeEach(() => {
    ;(serverLogger as any).logs.clear()
  })

  it('stores logs per session', async () => {
    await serverLogger.log({ level: 'info', category: 'test', metadata: {} })
    const logs = await serverLogger.getRecentLogs(1)
    expect(logs[0].category).toBe('test')
  })
})
