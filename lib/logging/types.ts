export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'api' | 'auth' | 'step' | 'system';
  provider?: 'google' | 'microsoft';
  metadata: {
    method?: string;
    url?: string;
    status?: number;
    duration?: number;
    requestBody?: unknown;
    responseBody?: unknown;
    error?: string;
    stepId?: string;
    userId?: string;
  };
}

export interface Logger {
  log(entry: Omit<LogEntry, 'id' | 'timestamp'>): void;
  getRecentLogs(count?: number): LogEntry[];
}
