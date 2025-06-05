import { renderHook, act } from '@testing-library/react'
import { useDebugLogger } from '@/hooks/use-debug-logger'
import type { LogEntry } from '@/lib/logging/types'

jest.mock('@/lib/utils', () => ({ isApiDebugEnabled: () => true }))

class FakeES {
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  constructor(public url: string) {
    ;(global as { latestES?: FakeES }).latestES = this
  }
  close() {}
}

global.EventSource = FakeES as unknown as typeof EventSource

function emit(es: FakeES, log: LogEntry) {
  es.onmessage?.({ data: JSON.stringify(log) })
}

test('collects logs and clears', () => {
  const { result } = renderHook(() => useDebugLogger())
  const es = (global as { latestES?: FakeES }).latestES as FakeES
  act(() => {
    emit(es, { id: '1', timestamp: 't', level: 'info', metadata: {} })
  })
  expect(result.current.logs.length).toBe(1)
  act(() => { result.current.clearLogs() })
  expect(result.current.logs.length).toBe(0)
})
