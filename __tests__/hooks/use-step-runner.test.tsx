import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { useStepRunner } from '@/components/dashboard/hooks/use-step-runner'
import { store } from '@/lib/redux/store'
import { setDomain, setTenantId, initializeSteps, updateStep, clearAllData } from '@/lib/redux/slices/app-state'
import { StepStatus } from '@/lib/constants/enums'
import type { StepId } from '@/lib/steps/step-refs'

jest.mock('@/hooks/use-session-sync', () => ({ useSessionSync: jest.fn() }))
jest.mock('@/hooks/use-step-execution', () => ({ useStepExecution: jest.fn() }))
jest.mock('@/hooks/use-auto-check', () => ({ useAutoCheck: jest.fn() }))

jest.mock('@/lib/steps', () => ({
  __esModule: true,
  allStepDefinitions: [
    { id: 'A', automatable: true },
    { id: 'B', automatable: true },
  ],
}))

import { useSessionSync } from '@/hooks/use-session-sync'
import { useStepExecution } from '@/hooks/use-step-execution'
import { useAutoCheck } from '@/hooks/use-auto-check'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

beforeEach(() => {
  store.dispatch(clearAllData())
  jest.clearAllMocks()
})

it('dispatches error when not authorized', async () => {
  ;(useSessionSync as jest.Mock).mockReturnValue({
    session: { hasGoogleAuth: false, hasMicrosoftAuth: true },
    status: 'authenticated',
  })
  const execMock = jest.fn()
  ;(useStepExecution as jest.Mock).mockReturnValue({ executeStep: execMock })
  ;(useAutoCheck as jest.Mock).mockReturnValue({ manualRefresh: jest.fn(), isChecking: false })
  const { result } = renderHook(() => useStepRunner(), { wrapper })
  await act(async () => {
    await result.current.handleExecute('A' as StepId)
  })
  expect(store.getState().ui.error?.message).toContain('Please sign in')
  expect(execMock).not.toHaveBeenCalled()
})

it('runs all pending steps', async () => {
  ;(useSessionSync as jest.Mock).mockReturnValue({
    session: { hasGoogleAuth: true, hasMicrosoftAuth: true },
    status: 'authenticated',
  })
  const execMock = jest.fn()
  ;(useStepExecution as jest.Mock).mockReturnValue({ executeStep: execMock })
  ;(useAutoCheck as jest.Mock).mockReturnValue({ manualRefresh: jest.fn(), isChecking: false })
  store.dispatch(setDomain('ex.com'))
  store.dispatch(setTenantId('tid'))
  store.dispatch(initializeSteps({}))
  const { result } = renderHook(() => useStepRunner(), { wrapper })
  await act(async () => {
    await result.current.runAllPending()
  })
  expect(execMock).toHaveBeenCalledWith('A')
  expect(execMock).toHaveBeenCalledWith('B')
})

it('stops running steps when a failure occurs', async () => {
  ;(useSessionSync as jest.Mock).mockReturnValue({
    session: { hasGoogleAuth: true, hasMicrosoftAuth: true },
    status: 'authenticated',
  })
  const execMock = jest.fn(async (id: string) => {
    if (id === 'A') {
      store.dispatch(updateStep({ id: 'A', status: StepStatus.FAILED }))
    }
  })
  ;(useStepExecution as jest.Mock).mockReturnValue({ executeStep: execMock })
  ;(useAutoCheck as jest.Mock).mockReturnValue({ manualRefresh: jest.fn(), isChecking: false })
  store.dispatch(setDomain('ex.com'))
  store.dispatch(setTenantId('tid'))
  store.dispatch(initializeSteps({ A: { status: StepStatus.PENDING }, B: { status: StepStatus.PENDING } }))
  const { result } = renderHook(() => useStepRunner(), { wrapper })
  await act(async () => {
    await result.current.runAllPending()
  })
  expect(execMock).toHaveBeenCalledWith('A')
  expect(execMock).not.toHaveBeenCalledWith('B')
})
