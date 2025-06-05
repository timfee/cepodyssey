import { ErrorManager } from '@/lib/error-handling/error-manager'
import { AuthenticationError } from '@/lib/api/auth-interceptor'
import { APIError } from '@/lib/api/utils'
import { Provider } from '@/lib/constants/enums'
import { store } from '@/lib/redux/store'
import { setError } from '@/lib/redux/slices/ui-state'

describe('ErrorManager.handle', () => {
  it('handles authentication errors', () => {
    const err = new AuthenticationError('token expired', Provider.GOOGLE)
    const result = ErrorManager.handle(err)
    expect(result).toEqual({
      category: 'auth',
      message: 'token expired',
      code: 'AUTH_EXPIRED',
      provider: Provider.GOOGLE,
      recoverable: true,
    })
  })

  it('handles api errors', () => {
    const err = new APIError('not enabled', 403, 'API_NOT_ENABLED')
    const result = ErrorManager.handle(err)
    expect(result).toEqual({
      category: 'api',
      message: 'not enabled',
      code: 'API_NOT_ENABLED',
      recoverable: true,
    })
  })

  it('handles generic errors', () => {
    const result = ErrorManager.handle(new Error('boom'))
    expect(result).toEqual({
      category: 'system',
      message: 'boom',
      recoverable: false,
    })
  })
})

describe('ErrorManager.dispatch', () => {
  it('dispatches to store', () => {
    const spy = jest.spyOn(store, 'dispatch').mockImplementation(jest.fn())
    ErrorManager.dispatch(new Error('oops'), { stepId: 'S-1' })
    expect(spy).toHaveBeenCalledWith(
      setError({
        message: 'oops',
        details: {
          stepId: 'S-1',
          category: 'system',
          code: undefined,
          provider: undefined,
          recoverable: false,
        },
      })
    )
  })
})
