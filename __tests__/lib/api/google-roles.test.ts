jest.mock('@/lib/api/google/client', () => ({
  googleApiClient: { get: jest.fn(), post: jest.fn() }
}))
jest.mock('@/lib/api/url-builder', () => ({
  googleDirectoryUrls: { roles: { assignments: { create: jest.fn(()=>'c'), list: jest.fn(()=> 'l') }, list: jest.fn(()=>'rl') } }
}))
import { roles } from '@/lib/api/google/resources/roles'
import { APIError } from '@/lib/api/utils'
import { googleApiClient } from '@/lib/api/google/client'
const client = googleApiClient as jest.Mocked<typeof googleApiClient>
beforeEach(() => jest.clearAllMocks())

test('assign wraps 409', async () => {
  const err = new APIError('dup', 409)
  client.post.mockRejectedValue(err)
  await expect(roles.assign('u','r')).rejects.toThrow('already')
})

test('listAssignments returns array', async () => {
  client.get.mockResolvedValue({ items: [1] })
  const res = await roles.listAssignments('u')
  expect(res).toEqual([1])
})
