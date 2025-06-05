import { isApiDebugEnabled } from "@/lib/utils";
import { getLogCollector } from "./log-collector";
interface AsyncLocalStorage<T> {
  run<R>(store: T, fn: () => R): R;
  getStore(): T | undefined;
}

// Resolve AsyncLocalStorage depending on environment
/* eslint-disable @typescript-eslint/no-require-imports */
const { AsyncLocalStorage: NodeAsyncLocalStorage } = (() => {
  try {
    return require("async_hooks");
  } catch {
    return {
      AsyncLocalStorage: require("./async-local-storage-polyfill")
        .AsyncLocalStorage,
    };
  }
})();
/* eslint-enable @typescript-eslint/no-require-imports */

const asyncLocalStorage = new (NodeAsyncLocalStorage as unknown as {
  new (): AsyncLocalStorage<{ requestId: string }>;
})();

export class ApiLogger {
  static runWithRequestId<T>(requestId: string, fn: () => T): T {
    return asyncLocalStorage.run({ requestId }, fn);
  }

  static getRequestId(): string | null {
    const store = asyncLocalStorage.getStore();
    return store?.requestId || null;
  }

  static logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const provider = this.detectProvider(url);

    // Always log to console
    console.log(`[API] ${init?.method || "GET"} ${url}`);

    if (!isApiDebugEnabled()) {
      return id;
    }

    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = init.headers;
      if (h instanceof Headers) {
        h.forEach((value, key) => {
          if (key.toLowerCase() !== "authorization") {
            headers[key] = value;
          } else {
            headers[key] = "Bearer [REDACTED]";
          }
        });
      }
    }

    let requestBody: unknown = undefined;
    if (init?.body) {
      try {
        requestBody =
          typeof init.body === "string" ? JSON.parse(init.body) : init.body;
      } catch {
        requestBody = init.body;
      }
    }

    const logEntry = {
      id,
      timestamp: new Date().toISOString(),
      method: init?.method || "GET",
      url,
      headers,
      requestBody,
      provider,
    };

    const requestId = this.getRequestId();
    if (typeof window === "undefined" && requestId) {
      const collector = getLogCollector(requestId);
      collector.addLog(logEntry);
    }

    return id;
  }

  static logResponse(
    id: string,
    response: Response,
    responseBody?: unknown,
    duration?: number
  ) {
    // Always log to console
    console.log(`[API] Response ${response.status} for ${id} (${duration}ms)`);

    if (!isApiDebugEnabled()) {
      return;
    }

    const updates = {
      responseStatus: response.status,
      responseBody,
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };

    const requestId = this.getRequestId();
    if (typeof window === "undefined" && requestId) {
      const collector = getLogCollector(requestId);
      const logs = collector.getLogs();
      const log = logs.find((l) => l.id === id);
      if (log) {
        Object.assign(log, updates);
      }
    }
  }

  static logError(id: string, error: unknown) {
    // Always log to console
    console.error(`[API] Error for request ${id}:`, error);

    if (!isApiDebugEnabled()) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const requestId = this.getRequestId();
    if (typeof window === "undefined" && requestId) {
      const collector = getLogCollector(requestId);
      const logs = collector.getLogs();
      const log = logs.find((l) => l.id === id);
      if (log) {
        log.error = errorMessage;
      }
    }
  }

  private static detectProvider(url: string): "google" | "microsoft" | "other" {
    if (
      url.includes("googleapis.com") ||
      url.includes("cloudidentity.googleapis.com")
    ) {
      return "google";
    }
    if (
      url.includes("graph.microsoft.com") ||
      url.includes("login.microsoftonline.com")
    ) {
      return "microsoft";
    }
    return "other";
  }
}
