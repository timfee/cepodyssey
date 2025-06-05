import { withExecutionHandling } from '@/lib/steps/utils/execute-wrapper'
import { validateRequiredOutputs } from '@/lib/steps/utils/validation'
import { handleExecutionError } from '@/lib/steps/utils/error-handling'

jest.mock('@/lib/steps/utils/validation', () => ({ validateRequiredOutputs: jest.fn() }))
jest.mock('@/lib/steps/utils/error-handling', () => ({ handleExecutionError: jest.fn() }))

const ctx = { domain: 'd', tenantId: 't', outputs: {} }

describe('withExecutionHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns validation error', async () => {
    ;(validateRequiredOutputs as jest.Mock).mockReturnValue({
      valid: false,
      error: { message: 'missing', code: 'MISS' },
    })
    const exec = jest.fn()
    const wrapped = withExecutionHandling({ stepId: 'X' as any, requiredOutputs: ['a'], executeLogic: exec })
    const result = await wrapped(ctx as any)
    expect(exec).not.toHaveBeenCalled()
    expect(result).toEqual({ success: false, error: { message: 'missing', code: 'MISS' } })
  })

  it('passes through success', async () => {
    ;(validateRequiredOutputs as jest.Mock).mockReturnValue({ valid: true })
    const exec = jest.fn().mockResolvedValue({ success: true })
    const wrapped = withExecutionHandling({ stepId: 'X' as any, requiredOutputs: [], executeLogic: exec })
    const result = await wrapped(ctx as any)
    expect(exec).toHaveBeenCalled()
    expect(result.success).toBe(true)
  })

  it('handles thrown errors', async () => {
    ;(validateRequiredOutputs as jest.Mock).mockReturnValue({ valid: true })
    const exec = jest.fn().mockRejectedValue(new Error('bad'))
    ;(handleExecutionError as jest.Mock).mockResolvedValue({ success: false, error: { message: 'bad' } })
    const wrapped = withExecutionHandling({ stepId: 'X' as any, requiredOutputs: [], executeLogic: exec })
    const result = await wrapped(ctx as any)
    expect(handleExecutionError).toHaveBeenCalled()
    expect(result.success).toBe(false)
  })
})
