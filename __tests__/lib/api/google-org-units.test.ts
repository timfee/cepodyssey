jest.mock('@/lib/api/google/client', () => ({
  googleApiClient: { get: jest.fn(), post: jest.fn() }
}))
jest.mock('@/lib/api/url-builder', () => ({
  googleDirectoryUrls: {
    orgUnits: {
      list: jest.fn(() => 'list'),
      create: jest.fn(() => 'create'),
      get: jest.fn(() => 'get'),
    },
  },
}))

import { orgUnits } from '@/lib/api/google/resources/org-units'
import { APIError } from '@/lib/api/utils'
import { googleApiClient } from '@/lib/api/google/client'

const mockClient = googleApiClient as jest.Mocked<typeof googleApiClient>

beforeEach(() => jest.clearAllMocks())

test('lists org units', async () => {
  mockClient.get.mockResolvedValue({ organizationUnits: [{ name: 'A' }] })
  const res = await orgUnits.list('c')
  expect(mockClient.get).toHaveBeenCalled()
  expect(res[0].name).toBe('A')
})

test('create throws AlreadyExistsError', async () => {
  const error = new APIError('exists', 409)
  mockClient.post.mockRejectedValue(error)
  await expect(orgUnits.create('foo')).rejects.toThrow('already exists')
})
