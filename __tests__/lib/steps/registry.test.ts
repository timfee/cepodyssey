import { getStep, getStepInputs, getStepOutputs, checkStep, executeStep } from '@/lib/steps/registry'
import type { StepDefinition } from '@/lib/types'
import type { StepId } from '@/lib/steps/step-refs'
import { Automatability } from '@/lib/constants/enums'

jest.mock('@/lib/api/api-logger', () => ({ ApiLogger: jest.fn().mockImplementation(() => ({ addLog: jest.fn() })) }))

const makeStep = (id: StepId): StepDefinition & { check: jest.Mock; execute: jest.Mock } => ({
  id,
  title: 't',
  description: 'd',
  details: 'det',
  category: 'Google',
  activity: 'Provisioning',
  provider: 'Google',
  automatability: Automatability.AUTOMATED,
  automatable: true,
  inputs: [{ key: 'in', label: 'i' }],
  outputs: [{ key: 'out', description: 'o' }],
  check: jest.fn(async () => ({ completed: true })),
  execute: jest.fn(async () => ({ success: true })),
})

const ctx = { domain: 'ex', tenantId: 't', outputs: {} }

describe('step registry integration', () => {
  const stepA = makeStep('G-1' as StepId)
  const stepB: StepDefinition = { ...makeStep('G-2' as StepId), check: undefined, execute: undefined as any }
  const defs = [stepA, stepB]

  it('gets steps and io definitions', () => {
    expect(getStep(defs, 'G-1' as StepId)).toBe(stepA)
    expect(getStepInputs(defs, 'G-1' as StepId)).toEqual(stepA.inputs)
    expect(getStepOutputs(defs, 'G-1' as StepId)).toEqual(stepA.outputs)
  })

  it('runs checkStep and passes logger', async () => {
    const result = await checkStep(defs, 'G-1' as StepId, ctx as any)
    expect(stepA.check).toHaveBeenCalledWith(expect.objectContaining({ domain: 'ex', tenantId: 't', logger: expect.anything() }))
    expect(result.completed).toBe(true)
  })

  it('returns message when step lacks check logic', async () => {
    const res = await checkStep(defs, 'G-2' as StepId, ctx as any)
    expect(res.message).toContain('No check')
  })

  it('throws when step id missing', async () => {
    await expect(checkStep(defs, 'X-0' as StepId, ctx as any)).rejects.toThrow('Step X-0 not found')
  })

  it('executes step or reports missing execute', async () => {
    const execRes = await executeStep(defs, 'G-1' as StepId, ctx as any)
    expect(stepA.execute).toHaveBeenCalledWith(expect.objectContaining({ logger: expect.anything() }))
    expect(execRes.success).toBe(true)

    const missingRes = await executeStep(defs, 'G-2' as StepId, ctx as any)
    expect(missingRes.success).toBe(false)
    expect(missingRes.error?.code).toBe('NO_EXECUTE_FUNCTION')
  })

  it('throws when executing unknown step', async () => {
    await expect(executeStep(defs, 'X-0' as StepId, ctx as any)).rejects.toThrow()
  })
})
