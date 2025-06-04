import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { appConfigSlice } from '@/lib/redux/slices/app-config'
import { setupStepsSlice } from '@/lib/redux/slices/setup-steps'
import { modalsSlice } from '@/lib/redux/slices/modals'
import { errorsSlice } from '@/lib/redux/slices/errors'

export function mockStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      appConfig: appConfigSlice.reducer,
      setupSteps: setupStepsSlice.reducer,
      modals: modalsSlice.reducer,
      errors: errorsSlice.reducer,
    },
    preloadedState,
  })
}

export function renderWithProviders(ui: React.ReactElement, { preloadedState = {}, store = mockStore(preloadedState), ...renderOptions } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}
