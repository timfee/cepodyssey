import { store } from "@/lib/redux/store";
import { addApiLog, updateApiLog, type ApiLogEntry } from "@/lib/redux/slices/debug-panel";
import { Logger } from "@/lib/utils/logger";
import { isApiDebugEnabled } from "@/lib/utils";
import { getLogCollector } from "./log-collector";

export class ApiLogger {
  private static currentRequestId: string | null = null;

  static setRequestId(requestId: string) {
    this.currentRequestId = requestId;
  }

  static clearRequestId() {
    this.currentRequestId = null;
  }

  static logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const provider = this.detectProvider(url);

    const debugEnabled = isApiDebugEnabled();

    if (!debugEnabled) {
      Logger.debug(
        "[ApiLogger]",
        `Request ${init?.method || "GET"} ${url}`,
      );
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

    const logEntry: ApiLogEntry = {
      id,
      timestamp: new Date().toISOString(),
      method: init?.method || "GET",
      url,
      headers,
      requestBody,
      provider,
    };

    if (typeof window === "undefined" && this.currentRequestId) {
      const collector = getLogCollector(this.currentRequestId);
      collector.addLog(logEntry);
    } else if (typeof window !== "undefined") {
      store.dispatch(addApiLog(logEntry));
    }

    Logger.debug(
      "[ApiLogger]",
      `Request ${init?.method || "GET"} ${url}`,
      requestBody,
    );

    return id;
  }

  static logResponse(
    id: string,
    response: Response,
    responseBody?: unknown,
    duration?: number,
  ) {
    const debugEnabled = isApiDebugEnabled();

    if (!debugEnabled) {
      Logger.debug(
        "[ApiLogger]",
        `Response ${response.status} for request ${id}`,
        responseBody,
      );
      return;
    }

    const updates = {
      responseStatus: response.status,
      responseBody,
      duration,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };

    if (typeof window === "undefined" && this.currentRequestId) {
      const collector = getLogCollector(this.currentRequestId);
      const logs = collector.getLogs();
      const log = logs.find((l) => l.id === id);
      if (log) {
        Object.assign(log, updates);
      }
    } else if (typeof window !== "undefined") {
      store.dispatch(updateApiLog({ id, updates }));
    }

    Logger.debug(
      "[ApiLogger]",
      `Response ${response.status} for request ${id}`,
      responseBody,
    );
  }

  static logError(id: string, error: unknown) {
    const debugEnabled = isApiDebugEnabled();

    if (!debugEnabled) {
      Logger.error("[ApiLogger]", `Error for request ${id}`, error);
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    if (typeof window === "undefined" && this.currentRequestId) {
      const collector = getLogCollector(this.currentRequestId);
      const logs = collector.getLogs();
      const log = logs.find((l) => l.id === id);
      if (log) {
        log.error = errorMessage;
      }
    } else if (typeof window !== "undefined") {
      store.dispatch(
        updateApiLog({
          id,
          updates: {
            error: errorMessage,
          },
        }),
      );
    }

    Logger.error("[ApiLogger]", `Error for request ${id}`, error);
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
