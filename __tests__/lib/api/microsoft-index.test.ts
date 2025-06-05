import { microsoftApi } from '@/lib/api/microsoft'

test('exposes microsoft resources', () => {
  expect(microsoftApi.applications).toBeDefined()
  expect(microsoftApi.servicePrincipals).toBeDefined()
})
