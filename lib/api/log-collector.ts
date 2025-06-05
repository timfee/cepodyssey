import type { ApiLogEntry } from "@/lib/redux/slices/debug-panel";

class LogCollector {
  private logs: ApiLogEntry[] = [];

  addLog(log: ApiLogEntry) {
    this.logs.push(log);
  }

  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Create a singleton instance per request
const collectors = new Map<string, LogCollector>();

export function getLogCollector(requestId: string): LogCollector {
  if (!collectors.has(requestId)) {
    collectors.set(requestId, new LogCollector());
  }
  return collectors.get(requestId)!;
}

export function clearLogCollector(requestId: string) {
  collectors.delete(requestId);
}
