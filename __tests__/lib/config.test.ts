describe('config', () => {
  const env = process.env
  beforeAll(() => {
    process.env = {
      AUTH_SECRET: 'x'.repeat(32),
      GOOGLE_CLIENT_ID: 'gid',
      GOOGLE_CLIENT_SECRET: 'gsec',
      GOOGLE_ADMIN_SCOPES: 'scopes',
      MICROSOFT_CLIENT_ID: 'mid',
      MICROSOFT_CLIENT_SECRET: 'msec',
      MICROSOFT_GRAPH_SCOPES: 'mscope',
      NEXT_PUBLIC_MICROSOFT_TENANT_ID: '00000000-0000-0000-0000-000000000000',
      NODE_ENV: 'test',
    } as any
    jest.resetModules()
  })

  afterAll(() => {
    process.env = env
  })

  it('parses environment variables', () => {
    const { config } = require('@/lib/config')
    expect(config.NODE_ENV).toBe('test')
    expect(config.GOOGLE_CLIENT_ID).toBe('gid')
    expect(config.MICROSOFT_CLIENT_ID).toBe('mid')
  })
})
