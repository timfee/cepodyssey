import { renderHook, act, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { useProgressPersistence } from '@/components/dashboard/hooks/use-progress-persistence'
import { store } from '@/lib/redux/store'
import { setDomain, updateStep, clearAllData } from '@/lib/redux/slices/app-state'
import { loadProgress, saveProgress } from '@/lib/redux/persistence'
import { StepStatus } from '@/lib/constants/enums'

jest.mock('@/lib/redux/persistence', () => ({
  loadProgress: jest.fn(),
  saveProgress: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/steps', () => ({
  allStepDefinitions: [ { id: 'A' }, { id: 'B' } ],
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useProgressPersistence', () => {
  beforeEach(() => {
    store.dispatch(clearAllData())
    jest.clearAllMocks()
  })

  it('loads persisted progress on mount', async () => {
    ;(loadProgress as jest.Mock).mockReturnValue({ steps: { A: { status: StepStatus.COMPLETED } }, outputs: { x: 1 } })
    store.dispatch(setDomain('example.com'))
    renderHook(() => useProgressPersistence(), { wrapper })
    await waitFor(() => expect(loadProgress).toHaveBeenCalledWith('example.com'))
    expect(store.getState().app.steps.A.status).toBe(StepStatus.COMPLETED)
    expect((store.getState().app.outputs as any).x).toBe(1)
  })

  it('initializes pending steps when no persisted data', async () => {
    ;(loadProgress as jest.Mock).mockReturnValue(null)
    store.dispatch(setDomain('example.com'))
    renderHook(() => useProgressPersistence(), { wrapper })
    await waitFor(() => expect(store.getState().app.steps.A).toBeDefined())
    expect(store.getState().app.steps).toEqual({ A: { status: StepStatus.PENDING }, B: { status: StepStatus.PENDING } })
  })

  it('saves progress when steps change', async () => {
    ;(loadProgress as jest.Mock).mockReturnValue(null)
    store.dispatch(setDomain('example.com'))
    renderHook(() => useProgressPersistence(), { wrapper })
    act(() => { store.dispatch(updateStep({ id: 'A', status: StepStatus.COMPLETED })) })
    await waitFor(() => expect(saveProgress).toHaveBeenCalled())
  })
})
