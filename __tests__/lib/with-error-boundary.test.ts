import { withErrorBoundary } from '@/lib/errors/boundary'
import { ErrorManager } from '@/lib/error-handling/error-manager'

describe('withErrorBoundary', () => {
  it('returns data on success', async () => {
    const res = await withErrorBoundary(() => Promise.resolve(5))
    expect(res).toEqual({ success: true, data: 5 })
  })

  it('dispatches and handles errors', async () => {
    jest.spyOn(ErrorManager, 'dispatch').mockImplementation(() => {})
    jest
      .spyOn(ErrorManager, 'handle')
      .mockReturnValue({ message: 'e', category: 'system', recoverable: false })
    const res = await withErrorBoundary(() => Promise.reject(new Error('bad')))
    expect(ErrorManager.dispatch).toHaveBeenCalled()
    expect(res.success).toBe(false)
  })
})
