import type { ApiLogEntry } from "@/lib/redux/slices/debug-panel";
import { isApiDebugEnabled } from "@/lib/utils";

export class ApiLogger {
  private logs: ApiLogEntry[] = [];

  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  /**
   * Add a plain text log entry for debugging purposes.
   */
  addLog(message: string) {
    this.logs.push({
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      method: "LOG",
      url: message,
    });
  }

  logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const provider = this.detectProvider(url);

    console.log(`[API Request] ${init?.method || "GET"} ${url}`);
    if (!isApiDebugEnabled()) return id;

    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key.toLowerCase()] =
            key.toLowerCase() === "authorization" ? "Bearer [REDACTED]" : value;
        });
      }
    }

    const logEntry: ApiLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      method: init?.method || "GET",
      url,
      headers,
      requestBody:
        init?.body && typeof init.body === "string"
          ? JSON.parse(init.body)
          : undefined,
      provider,
    };
    this.logs.push(logEntry);
    return id;
  }

  logResponse(
    id: string,
    response: Response,
    responseBody?: unknown,
    duration?: number,
  ) {
    console.log(`[API Response] ${response.status} for ${id} in ${duration}ms`);
    if (!isApiDebugEnabled()) return;

    const log = this.logs.find((l) => l.id === id);
    if (log) {
      Object.assign(log, {
        responseStatus: response.status,
        responseBody,
        duration,
        error: response.ok ? undefined : `HTTP Error ${response.status}`,
      });
    }
  }

  logError(id: string, error: unknown) {
    console.error(`[API Error] for request ${id}:`, error);
    if (!isApiDebugEnabled()) return;

    const log = this.logs.find((l) => l.id === id);
    if (log) {
      log.error = error instanceof Error ? error.message : String(error);
    }
  }

  private detectProvider(url: string): "google" | "microsoft" | "other" {
    if (
      url.startsWith(process.env.GOOGLE_API_BASE!) ||
      url.startsWith(process.env.GOOGLE_IDENTITY_BASE!)
    )
      return "google";
    if (url.startsWith(process.env.GRAPH_API_BASE!)) return "microsoft";
    return "other";
  }
}
