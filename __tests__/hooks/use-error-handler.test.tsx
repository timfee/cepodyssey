import { renderHook } from '@testing-library/react'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { useAppDispatch } from '@/hooks/use-redux'
import { setError } from '@/lib/redux/slices/ui-state'

jest.mock('@/hooks/use-redux', () => ({ useAppDispatch: jest.fn() }))

describe('useErrorHandler', () => {
  it('dispatches error with message', () => {
    const dispatch = jest.fn()
    ;(useAppDispatch as jest.Mock).mockReturnValue(dispatch)
    const { result } = renderHook(() => useErrorHandler())
    result.current.handleError(new Error('oops'), { stepTitle: 'Step' })
    expect(dispatch).toHaveBeenCalledWith(setError({ message: 'oops', details: { stepTitle: 'Step' } }))
  })
})
