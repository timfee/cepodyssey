import { googleApi } from '@/lib/api/google'

test('exposes google resources', () => {
  expect(googleApi.users).toBeDefined()
  expect(googleApi.orgUnits).toBeDefined()
})
