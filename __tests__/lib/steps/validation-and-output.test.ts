import { validateRequiredOutputs } from '@/lib/steps/utils/validation'
import { getRequiredOutput } from '@/lib/steps/utils/get-output'

describe('validateRequiredOutputs', () => {
  it('detects missing outputs', () => {
    const result = validateRequiredOutputs(
      { domain: 'd', tenantId: 't', outputs: { a: 1 } },
      ['a', 'b'],
      'G-1',
    )
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe('MISSING_DEPENDENCY')
    expect(result.error?.message).toContain('b')
    expect(result.error?.message).toContain('G-1')
  })

  it('detects missing config', () => {
      const result = validateRequiredOutputs(
        { domain: null as unknown as string, tenantId: null as unknown as string, outputs: {} },
        [],
      )
    expect(result.valid).toBe(false)
    expect(result.error?.code).toBe('MISSING_CONFIG')
    expect(result.error?.message).toContain('domain')
    expect(result.error?.message).toContain('tenantId')
  })

  it('returns valid when all present', () => {
    const result = validateRequiredOutputs(
      { domain: 'd', tenantId: 't', outputs: { x: 1 } },
      ['x'],
    )
    expect(result.valid).toBe(true)
  })
})

describe('getRequiredOutput', () => {
  it('returns value when present', () => {
    const ctx = { domain: 'd', tenantId: 't', outputs: { x: 10 } }
    expect(getRequiredOutput<number>(ctx, 'x')).toBe(10)
  })

  it('throws when missing', () => {
    const ctx = { domain: 'd', tenantId: 't', outputs: {} }
    expect(() => getRequiredOutput(ctx, 'missing')).toThrow("missing")
  })
})
