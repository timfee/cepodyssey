import { store } from "@/lib/redux/store";
import {
  addApiLog,
  updateApiLog,
  type ApiLogEntry,
} from "@/lib/redux/slices/debug-panel";

// Server-side log storage used to expose logs via the debug API route
const g = globalThis as { __API_LOGS__?: ApiLogEntry[] };
const serverLogs: ApiLogEntry[] = g.__API_LOGS__ || [];
g.__API_LOGS__ = serverLogs;

export class ApiLogger {
  static logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const provider = this.detectProvider(url);

    if (
      process.env.NODE_ENV !== "development" &&
      !process.env.NEXT_PUBLIC_ENABLE_API_DEBUG
    ) {
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

    const entry = {
      id,
      timestamp: new Date().toISOString(),
      method: init?.method || "GET",
      url,
      headers,
      requestBody,
      provider,
    } as import("@/lib/redux/slices/debug-panel").ApiLogEntry;

    if (typeof window === "undefined") {
      serverLogs.push(entry);
    } else {
      store.dispatch(addApiLog(entry));
    }

    return id;
  }

  static logResponse(
    id: string,
    response: Response,
    responseBody?: unknown,
    duration?: number,
  ) {
    if (
      process.env.NODE_ENV !== "development" &&
      !process.env.NEXT_PUBLIC_ENABLE_API_DEBUG
    ) {
      return;
    }

    const updates = {
      responseStatus: response.status,
      responseBody,
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };

    if (typeof window === "undefined") {
      const log = serverLogs.find((l) => l.id === id);
      if (log) Object.assign(log, updates);
    } else {
      store.dispatch(updateApiLog({ id, updates }));
    }
  }

  static logError(id: string, error: unknown) {
    if (
      process.env.NODE_ENV !== "development" &&
      !process.env.NEXT_PUBLIC_ENABLE_API_DEBUG
    ) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (typeof window === "undefined") {
      const log = serverLogs.find((l) => l.id === id);
      if (log) log.error = errorMessage;
    } else {
      store.dispatch(updateApiLog({ id, updates: { error: errorMessage } }));
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
