import { saveProgress, loadProgress } from '@/lib/redux/persistence'
import { secureStorage } from '@/lib/storage'

jest.mock('@/lib/storage', () => {
  const actual = jest.requireActual('@/lib/storage')
  return { ...actual, secureStorage: { save: jest.fn(), load: jest.fn() } }
})

jest.mock('@/lib/steps', () => ({
  allStepDefinitions: [
    { id: 'A', execute: jest.fn() },
    { id: 'B', check: jest.fn() },
  ],
}))

describe('persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(secureStorage.load as jest.Mock).mockReturnValue(null)
  })

  it('saves progress with correct key', async () => {
    await saveProgress('example.com', { steps: {}, outputs: {} })
    expect(secureStorage.save).toHaveBeenCalledWith('automation-progress-example.com', { steps: {}, outputs: {} })
  })

  it('loads progress and filters checkable steps', () => {
    ;(secureStorage.load as jest.Mock).mockReturnValue({ steps: { A: { status: 'pending' }, B: { status: 'completed' } }, outputs: { foo: 'bar' } })
    const result = loadProgress('example.com')
    expect(result).toEqual({ steps: { A: { status: 'pending' } }, outputs: { foo: 'bar' } })
  })
})
