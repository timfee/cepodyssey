jest.mock('@/lib/api/microsoft/client', () => ({
  microsoftApiClient: { request: jest.fn() }
}))
jest.mock('@/lib/api/url-builder', () => ({
  microsoftAuthUrls: { samlMetadata: jest.fn(() => 'url') }
}))
import { saml } from '@/lib/api/microsoft/resources/saml'
import { microsoftApiClient } from '@/lib/api/microsoft/client'
const client = microsoftApiClient as jest.Mocked<typeof microsoftApiClient>

beforeEach(() => jest.clearAllMocks())

test('parses metadata xml', async () => {
  const xml = `<EntityDescriptor entityID="eid"><IDPSSODescriptor><SingleSignOnService Location="sso"/><KeyDescriptor><KeyInfo><X509Data><X509Certificate>cert</X509Certificate></X509Data></KeyInfo></KeyDescriptor></IDPSSODescriptor></EntityDescriptor>`
  client.request.mockResolvedValue(xml)
  const result = await saml.getMetadata('t','a')
  expect(result.entityId).toBe('eid')
  expect(result.ssoUrl).toBe('sso')
})
