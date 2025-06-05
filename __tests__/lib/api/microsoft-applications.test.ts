jest.mock('@/lib/api/microsoft/client', () => ({
  microsoftApiClient: { get: jest.fn() }
}))
jest.mock('@/lib/api/url-builder', () => ({
  microsoftGraphUrls: { applications: { list: jest.fn(() => 'list') } }
}))
import { applications } from '@/lib/api/microsoft/resources/applications'
import { microsoftApiClient } from '@/lib/api/microsoft/client'
const client = microsoftApiClient as any

beforeEach(() => jest.clearAllMocks())

test('lists applications', async () => {
  client.get.mockResolvedValue({ value: [1,2] })
  const res = await applications.list('f')
  expect(client.get).toHaveBeenCalledWith('list', undefined)
  expect(res).toEqual([1,2])
})
