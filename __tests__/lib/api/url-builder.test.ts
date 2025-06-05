jest.mock('@/lib/config', () => ({
  config: {
    GOOGLE_API_BASE: 'https://g',
    GOOGLE_IDENTITY_BASE: 'https://i',
    GRAPH_API_BASE: 'https://m',
    GOOGLE_OAUTH_BASE: 'https://o',
    MICROSOFT_LOGIN_BASE: 'https://l',
    GOOGLE_ADMIN_CONSOLE_BASE: 'https://admin',
    AZURE_PORTAL_BASE: 'https://portal',
  },
}))

import { googleDirectoryUrls, microsoftAuthUrls } from '@/lib/api/url-builder'

describe('url-builder', () => {
  it('builds directory user list url', () => {
    const url = googleDirectoryUrls.users.list({ domain: 'ex.com', maxResults: 5 })
    expect(url).toContain('ex.com')
    expect(url).toContain('maxResults=5')
  })

  it('builds microsoft token url', () => {
    expect(microsoftAuthUrls.token('tid')).toBe('https://l/tid/oauth2/v2.0/token')
  })
})
