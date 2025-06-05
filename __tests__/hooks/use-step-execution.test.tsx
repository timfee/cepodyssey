import { renderHook, act } from '@testing-library/react'
import { useStepExecution } from '@/hooks/use-step-execution'
import { Provider } from 'react-redux'
import { store } from '@/lib/redux/store'
import { executeStepAction } from '@/app/actions/step-actions'
import { clearAllData } from '@/lib/redux/slices/app-state'
import { ErrorManager } from '@/lib/error-handling/error-manager'
import type { StepId } from '@/lib/steps/step-refs'
import type { StepDefinition } from '@/lib/types'

jest.mock('@/lib/steps', () => {
  const step: StepDefinition & { execute: jest.Mock } = {
    id: 'G-1',
    title: 'Test step',
    description: 'desc',
    details: 'details',
    category: 'Google',
    activity: 'Provisioning',
    provider: 'Google',
    automatability: 'automated',
    automatable: true,
    execute: jest.fn(async () => ({ success: true, outputs: { testOutput: 'value' } })),
  }
  return { __esModule: true, allStepDefinitions: [step], mockStep: step }
})

jest.mock('@/app/actions/step-actions')
jest.mock('@/lib/error-handling/error-manager', () => ({
  ErrorManager: { dispatch: jest.fn() },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useStepExecution', () => {
  beforeEach(() => {
    store.dispatch(clearAllData())
    jest.clearAllMocks()
  })
  it('should execute step and update state', async () => {
    const mockResult = {
      success: true,
      message: 'Step completed',
      outputs: { testOutput: 'value' },
    }
    ;(executeStepAction as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useStepExecution(), { wrapper })

    await act(async () => {
      await result.current.executeStep('G-1' as StepId)
    })

    const state = store.getState()
    expect(state.app.steps['G-1'].status).toBe('completed')
    expect((state.app.outputs as Record<string, unknown>).testOutput).toBe('value')
  })

  it('handles execution failure', async () => {
    const failResult = {
      success: false,
      message: 'Bad',
      error: { message: 'Bad', code: 'FAIL' },
      outputs: { detail: 'x' },
    }
    ;(executeStepAction as jest.Mock).mockResolvedValue(failResult)

    const { result } = renderHook(() => useStepExecution(), { wrapper })
    await act(async () => {
      await result.current.executeStep('G-1' as StepId)
    })
    const state = store.getState()
    expect(state.app.steps['G-1'].status).toBe('failed')
    expect(ErrorManager.dispatch).toHaveBeenCalled()
  })

  it('dispatches error when step not found', async () => {
    const { result } = renderHook(() => useStepExecution(), { wrapper })
    await act(async () => {
      await result.current.executeStep('X-1' as StepId)
    })
    expect(ErrorManager.dispatch).toHaveBeenCalledWith(new Error('Step X-1 not found'), { stepId: 'X-1' })
    expect(executeStepAction).not.toHaveBeenCalled()
  })
})
