import { Logger, LogLevel } from '@/lib/utils/logger'

jest.mock('@/lib/config', () => ({
  config: {
    NODE_ENV: 'test',
    NEXT_PUBLIC_LOG_TO_CONSOLE: 'true',
  },
}))

describe('Logger', () => {
  beforeEach(() => {
    Logger.clearHistory()
    jest.clearAllMocks()
  })

  it('records debug logs when level allows', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    Logger.setLevel(LogLevel.DEBUG)
    Logger.debug('cat', 'msg', 1)
    const history = Logger.getHistory(1)
    expect(history[0].level).toBe(LogLevel.DEBUG)
    expect(spy).toHaveBeenCalledWith('[cat]', 'msg', 1)
  })

  it('skips info logs when level higher', () => {
    jest.spyOn(console, 'info').mockImplementation(() => {})
    Logger.setLevel(LogLevel.WARN)
    Logger.info('cat', 'nope')
    expect(Logger.getHistory()).toHaveLength(0)
  })

  it('maintains max history size', () => {
    Logger.setLevel(LogLevel.DEBUG)
    for (let i = 0; i < 110; i++) {
      Logger.debug('c', String(i))
    }
    expect(Logger.getHistory().length).toBeLessThanOrEqual(100)
  })

  it('captures error with stack and handles dev', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    Logger.setLevel(LogLevel.DEBUG)
    const err = new Error('x')
    Logger.error('cat', 'boom', err)
    const history = Logger.getHistory(1)[0]
    expect(history.stackTrace).toContain('Error: x')
    expect(spy).toHaveBeenCalled()
  })
})
