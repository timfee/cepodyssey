import '@testing-library/jest-dom'
import 'cross-fetch/polyfill'

/* eslint-disable @typescript-eslint/no-var-requires */
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util') as typeof import('util')
  ;(global as any).TextEncoder = TextEncoder
  ;(global as any).TextDecoder = TextDecoder
}

if (typeof (global as any).TransformStream === 'undefined') {
  const { TransformStream } = require('stream/web') as typeof import('stream/web')
  // @ts-expect-error stream/web types not available in test env
  ;(global as any).TransformStream = TransformStream
}

if (typeof (global as any).BroadcastChannel === 'undefined') {
  class BroadcastChannelMock {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    postMessage() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    close() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    addEventListener() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeEventListener() {}
  }
  // @ts-expect-error BroadcastChannel not implemented in jsdom
  ;(global as any).BroadcastChannel = BroadcastChannelMock
}

const { server } = require('./test/mocks/server') as typeof import('./test/mocks/server')
const { mockEnv } = require('./test/utils/mock-env') as typeof import('./test/utils/mock-env')
require('./test/mocks/next-auth')

beforeAll(() => {
  mockEnv()
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  redirect: jest.fn(),
}))

jest.mock('server-only', () => ({}))
