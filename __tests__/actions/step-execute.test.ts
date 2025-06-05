import { executeStepAction } from '@/app/actions/step-actions'
import { SessionManager } from '@/lib/auth/session-manager'
import type { StepDefinition } from '@/lib/types'

jest.mock('@/lib/steps', () => {
  const step: StepDefinition & { execute: jest.Mock } = {
    id: 'S-1',
    title: 'step',
    description: '',
    details: '',
    category: 'c',
    activity: 'a',
    provider: 'p',
    automatability: 'automated',
    automatable: true,
    execute: jest.fn(async () => ({ success: true, outputs: { done: true } })),
  }
  return { __esModule: true, allStepDefinitions: [step], mockStep: step }
})

jest.mock('@/lib/auth/session-manager', () => ({
  SessionManager: { validate: jest.fn() }
}))

describe('executeStepAction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(SessionManager.validate as jest.Mock).mockResolvedValue({ valid: true })
  })

  it('executes step when session valid', async () => {
    const result = await executeStepAction('S-1', { domain: 'ex', tenantId: 't', outputs: {} })
    expect(result.success).toBe(true)
  })

  it('returns auth error when session invalid', async () => {
    ;(SessionManager.validate as jest.Mock).mockResolvedValue({ valid: false, error: { message: 'no', outputs: { a: 1 } } })
    const result = await executeStepAction('S-1', { domain: 'ex', tenantId: 't', outputs: {} })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('AUTH_EXPIRED')
  })
})
