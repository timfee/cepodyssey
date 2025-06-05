import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '@/lib/redux/store'
import type { ReactElement } from 'react'

export function renderWithProviders(ui: ReactElement) {
  return render(<Provider store={store}>{ui}</Provider>)
}
