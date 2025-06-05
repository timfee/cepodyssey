import { http, HttpResponse } from 'msw'

export const microsoftHandlers = [
  http.get('https://graph.microsoft.com/v1.0/servicePrincipals', ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('$filter')

    if (filter?.includes('appId eq')) {
      return HttpResponse.json({
        value: [{
          id: 'mock-sp-id',
          appId: 'mock-app-id',
          displayName: 'Test App',
          accountEnabled: true,
        }],
      })
    }

    return HttpResponse.json({ value: [] })
  }),
]
