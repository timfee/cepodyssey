import { useEffect, useRef, useState } from 'react';
import type { LogEntry } from '@/lib/logging/types';
import { isApiDebugEnabled } from '@/lib/utils';
import { Logger } from '@/lib/utils/logger';

/**
 * Connects to the SSE log stream and exposes recent server logs for the
 * debug panel.
 */
export function useDebugLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isApiDebugEnabled()) return;

    const eventSource = new EventSource('/api/debug/logs/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const log: LogEntry = JSON.parse(event.data);
        setLogs((prev) => [log, ...prev].slice(0, 100));
      } catch (e) {
        Logger.error('[DebugLogger]', 'Failed to parse log:', e);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          eventSourceRef.current = new EventSource('/api/debug/logs/stream');
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const clearLogs = () => setLogs([]);

  return { logs, isConnected, clearLogs };
}
