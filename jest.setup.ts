import '@testing-library/jest-dom'
import 'cross-fetch/polyfill'

import { TextDecoder, TextEncoder } from 'util'
import { TransformStream } from 'stream/web'

if (typeof global.TextEncoder === 'undefined') {
  Object.assign(global as unknown as Record<string, unknown>, {
    TextEncoder,
    TextDecoder,
  })
}

if (typeof (global as { TransformStream?: unknown }).TransformStream === 'undefined') {
  // @ts-expect-error stream/web types not available in test env
  ;(global as { TransformStream?: unknown }).TransformStream = TransformStream
}

  if (typeof (global as { BroadcastChannel?: unknown }).BroadcastChannel === 'undefined') {
  class BroadcastChannelMock {
     
    constructor() {}
     
    postMessage() {}
     
    close() {}
     
    addEventListener() {}
     
    removeEventListener() {}
  }
  // @ts-expect-error BroadcastChannel not implemented in jsdom
  ;(global as { BroadcastChannel?: unknown }).BroadcastChannel = BroadcastChannelMock
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { server } = require('./test/mocks/server') as typeof import('./test/mocks/server')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { mockEnv } = require('./test/utils/mock-env') as typeof import('./test/utils/mock-env')
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
