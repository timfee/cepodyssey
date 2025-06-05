import { http, HttpResponse } from 'msw'

export const googleHandlers = [
  http.post('https://admin.googleapis.com/admin/directory/v1/users', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      id: 'mock-user-id',
      primaryEmail: body.primaryEmail,
      name: body.name,
      orgUnitPath: body.orgUnitPath,
    })
  }),

  http.get('https://admin.googleapis.com/admin/directory/v1/users/:email', ({ params }) => {
    if (params.email === 'nonexistent@example.com') {
      return HttpResponse.json({ error: { code: 404 } }, { status: 404 })
    }
    return HttpResponse.json({
      id: 'mock-user-id',
      primaryEmail: params.email,
      isAdmin: true,
      suspended: false,
    })
  }),

  http.post('https://admin.googleapis.com/admin/directory/v1/customer/:customerId/orgunits', async ({ request }) => {

    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      orgUnitId: 'mock-ou-id',
      orgUnitPath: `/${body.name}`,
      name: body.name,
    })
  }),

  http.get('https://admin.googleapis.com/admin/directory/v1/customer/:customerId/orgunits/:ou', () => {
    return HttpResponse.json({ error: { code: 404 } }, { status: 404 })
  }),
]
