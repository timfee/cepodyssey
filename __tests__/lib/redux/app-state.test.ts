import { appStateSlice, initializeConfig, addOutput, markStepComplete, markStepIncomplete, clearAllCheckTimestamps, updateStep } from '@/lib/redux/slices/app-state'

const reducer = appStateSlice.reducer

describe('appStateSlice', () => {
  it('initializes config and adds outputs', () => {
    const state = reducer(undefined, initializeConfig({ domain: 'ex.com', outputs: { a: 1 } }))
    const afterAdd = reducer(state, addOutput({ key: 'b', value: 2 }))
    expect(afterAdd.domain).toBe('ex.com')
    expect(afterAdd.outputs).toEqual({ a: 1, b: 2 })
  })

  it('handles step completion and clearing timestamps', () => {
    let state = reducer(undefined, markStepComplete({ id: 'S-1', isUserMarked: false }))
    expect(state.steps['S-1'].status).toBe('completed')
    state = reducer(state, markStepIncomplete('S-1'))
    expect(state.steps['S-1'].status).toBe('pending')
    state = reducer(state, updateStep({ id: 'S-1', lastCheckedAt: new Date().toISOString() }))
    state = reducer(state, clearAllCheckTimestamps())
    expect(state.steps['S-1'].lastCheckedAt).toBeUndefined()
  })
})
