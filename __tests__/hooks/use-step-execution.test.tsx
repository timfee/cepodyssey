import { renderHook, act } from '@testing-library/react'
import { useStepExecution } from '@/hooks/use-step-execution'
import { Provider } from 'react-redux'
import { store } from '@/lib/redux/store'
import * as stepActions from '@/app/actions/step-actions'
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useStepExecution', () => {
  it('should execute step and update state', async () => {
    const mockResult = {
      success: true,
      message: 'Step completed',
      outputs: { testOutput: 'value' },
    }
    ;(stepActions.executeStepAction as jest.Mock).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useStepExecution(), { wrapper })

    await act(async () => {
      await result.current.executeStep('G-1' as StepId)
    })

    const state = store.getState()
    expect(state.app.steps['G-1'].status).toBe('completed')
    expect((state.app.outputs as Record<string, unknown>).testOutput).toBe('value')
  })
})
