import { uiStateSlice, openStepDetailsModal, closeStepDetailsModal, setError, clearError, addApiLog } from '@/lib/redux/slices/ui-state'
import { mockStep } from '@/test/fixtures/steps'

const reducer = uiStateSlice.reducer

describe('uiStateSlice', () => {
  it('opens and closes step details modal', () => {
    let state = reducer(undefined, openStepDetailsModal({ step: mockStep, outputs: { foo: 'bar' } }))
    expect(state.modals.stepDetails.isOpen).toBe(true)
    expect(state.modals.stepDetails.outputs.foo).toBe('bar')
    state = reducer(state, closeStepDetailsModal())
    expect(state.modals.stepDetails.isOpen).toBe(false)
    expect(state.modals.stepDetails.step).toBeNull()
  })

  it('sets and clears errors and adds logs', () => {
    let state = reducer(undefined, setError({ message: 'err' }))
    expect(state.error?.message).toBe('err')
    state = reducer(state, clearError())
    expect(state.error).toBeNull()
    state = reducer(state, addApiLog({ id: '1', timestamp: 'now', level: 'info', metadata: {} }))
    expect(state.debugPanel.logs.length).toBe(1)
  })
})
