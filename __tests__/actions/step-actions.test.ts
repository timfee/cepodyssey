import { executeStepCheck } from '@/app/actions/step-actions'
import { auth } from '@/app/(auth)/auth'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'
import type { StepContext } from '@/lib/types'

jest.mock('@/app/(auth)/auth')

describe('Step Actions', () => {
  describe('executeStepCheck', () => {
    it('should check if org unit exists', async () => {
      const context: StepContext = {
        domain: 'example.com',
        tenantId: 'test-tenant',
        outputs: {},
      }

      const result = await executeStepCheck('G-1', context)

      expect(result.completed).toBe(false)
      expect(result.message).toContain('not found')
    })

    it('should handle authentication errors', async () => {
      ;(auth as jest.Mock).mockResolvedValueOnce(null)

      const result = await executeStepCheck('G-1', {} as StepContext)

      expect(result.completed).toBe(false)
      expect(result.outputs?.errorCode).toBe('AUTH_EXPIRED')
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.get('*', () => {
          return HttpResponse.json(
            { error: { message: 'API rate limit exceeded' } },
            { status: 429 },
          )
        }),
      )

      const result = await executeStepCheck('G-1', {
        domain: 'example.com',
        tenantId: 'test-tenant',
        outputs: {},
      } as StepContext)

      expect(result.completed).toBe(false)
      expect(result.message).toContain('rate limit')
    })
  })
})
