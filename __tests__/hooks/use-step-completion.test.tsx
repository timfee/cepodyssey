import { renderHook, act } from '@testing-library/react'
import { useStepCompletion } from '@/hooks/use-step-completion'
import { secureStorage } from '@/lib/storage'

jest.mock('@/lib/storage', () => ({ secureStorage: { save: jest.fn(), load: jest.fn() } }))

describe('useStepCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes from storage and saves changes', () => {
    ;(secureStorage.load as jest.Mock).mockReturnValue(true)
    const { result } = renderHook(() => useStepCompletion('A'))
    expect(result.current[0]).toBe(true)
    act(() => result.current[1](false))
    expect(secureStorage.save).toHaveBeenCalledWith('workflow-step-status-A', false)
  })
})
