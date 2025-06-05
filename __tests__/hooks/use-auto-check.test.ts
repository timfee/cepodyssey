/// <reference types="@testing-library/jest-dom" />
import { renderHook, act } from '@testing-library/react'
import { useAutoCheck } from '@/hooks/use-auto-check'
import { useAppSelector } from '@/hooks/use-redux'

jest.mock('@/hooks/use-redux')

jest.mock('@/lib/steps', () => ({
  __esModule: true,
  allStepDefinitions: [
    { id: 'A', check: jest.fn() },
    { id: 'B', check: jest.fn() },
  ],
}))

const selector = useAppSelector as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe('useAutoCheck', () => {
  it('executes checks when configuration is ready', async () => {
    selector.mockImplementation((sel) =>
      sel({ app: { domain: 'ex.com', tenantId: 'tid', steps: {} } }),
    )
    const exec = jest.fn().mockResolvedValue({})
    const { result } = renderHook(() => useAutoCheck(exec))
    await act(async () => {
      await result.current.manualRefresh()
    })
    expect(exec).toHaveBeenCalledWith('A')
    expect(exec).toHaveBeenCalledWith('B')
  })

  it('skips checks without configuration', async () => {
    selector.mockImplementation((sel) => sel({ app: { domain: null, tenantId: null, steps: {} } }))
    const exec = jest.fn()
    const { result } = renderHook(() => useAutoCheck(exec))
    await act(async () => {
      await result.current.manualRefresh()
    })
    expect(exec).not.toHaveBeenCalled()
  })
})
