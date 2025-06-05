jest.mock('@/lib/api/microsoft/client', () => ({
  microsoftApiClient: { post: jest.fn() }
}))
jest.mock('@/lib/api/url-builder', () => ({
  microsoftGraphUrls: { servicePrincipals: { synchronization: { jobs: { start: jest.fn(()=> 'start'), create: jest.fn(()=> 'create') } } } }
}))
import { provisioning } from '@/lib/api/microsoft/resources/provisioning'
import { APIError } from '@/lib/api/utils'
import { microsoftApiClient } from '@/lib/api/microsoft/client'
const client = microsoftApiClient as any

beforeEach(() => jest.clearAllMocks())

test('startJob returns alreadyExists on 409', async () => {
  client.post.mockRejectedValue(new APIError('dup', 409))
  const res = await provisioning.startJob('sp','job').catch(r=>r)
  expect(res).toEqual({ alreadyExists: true })
})
