import { validateRequiredOutputs, debounce, isApiDebugEnabled } from '@/lib/utils'
jest.mock('@/lib/config', () => ({ config: { NODE_ENV: 'test', NEXT_PUBLIC_ENABLE_API_DEBUG: 'false' } }))

describe('utils', () => {
  it('validates required outputs', () => {
    const result = validateRequiredOutputs({ a: 1 }, ['a', 'b'])
    expect(result.valid).toBe(false)
    expect(result.missing).toEqual(['b'])
  })

  it('debounce delays invocation', () => {
    jest.useFakeTimers()
    const fn = jest.fn()
    const debounced = debounce(fn, 100)
    debounced('x')
    jest.advanceTimersByTime(50)
    expect(fn).not.toHaveBeenCalled()
    jest.advanceTimersByTime(60)
    expect(fn).toHaveBeenCalledWith('x')
    jest.useRealTimers()
  })

  it('isApiDebugEnabled respects config', () => {
    expect(isApiDebugEnabled()).toBe(false)
  })
})
