import * as slices from '@/lib/redux/slices'

test('exports slice objects', () => {
  expect(slices.appStateSlice).toBeDefined()
  expect(slices.uiStateSlice).toBeDefined()
})
