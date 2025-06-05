import { googleApi } from '@/lib/api/google'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import { AlreadyExistsError } from '@/lib/api/errors'

describe('Google API', () => {
  describe('users', () => {
    it('should create a user', async () => {
      const user = await googleApi.users.create({
        primaryEmail: 'test@example.com',
        name: { givenName: 'Test', familyName: 'User' },
      })

      expect(user.primaryEmail).toBe('test@example.com')
      expect(user.id).toBe('mock-user-id')
    })

    it('should throw AlreadyExistsError on 409', async () => {
      server.use(
        http.post('*/users', () => {
          return HttpResponse.json(
            { error: { code: 409, message: 'Entity already exists' } },
            { status: 409 },
          )
        }),
      )

      await expect(
        googleApi.users.create({ primaryEmail: 'existing@example.com' }),
      ).rejects.toThrow(AlreadyExistsError)
    })

    it('should return null for non-existent user', async () => {
      const user = await googleApi.users.get('nonexistent@example.com')
      expect(user).toBeNull()
    })
  })
})
