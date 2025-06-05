import { renderWithProviders } from '@/test/utils/render'
import { InitialConfigLoader } from '@/components/initial-config-loader'
import { setInitialConfig } from '@/lib/redux/slices/app-state'

const dispatch = jest.fn()
jest.mock('@/hooks/use-redux', () => ({
  useAppDispatch: () => dispatch,
}))

describe('InitialConfigLoader', () => {
  it('dispatches initial config on mount', () => {
    renderWithProviders(<InitialConfigLoader domain="ex.com" tenantId="tenant" />)
    expect(dispatch).toHaveBeenCalledWith(setInitialConfig({ domain: 'ex.com', tenantId: 'tenant' }))
  })
})
