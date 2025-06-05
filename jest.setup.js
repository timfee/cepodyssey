import '@testing-library/jest-dom'
import 'cross-fetch/polyfill'
/* eslint-disable @typescript-eslint/no-require-imports */
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}
if (typeof global.TransformStream === 'undefined') {
  const { TransformStream } = require('stream/web')
  // @ts-ignore
  global.TransformStream = TransformStream
}
if (typeof global.BroadcastChannel === 'undefined') {
  class BroadcastChannelMock {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  // @ts-ignore
  global.BroadcastChannel = BroadcastChannelMock
}

const { server } = require('./test/mocks/server')
const { mockEnv } = require('./test/utils/mock-env')
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
