import { store } from "@/lib/redux/store";
import { addApiLog, updateApiLog } from "@/lib/redux/slices/debug-panel";
import { Logger } from "@/lib/utils/logger";

export class ApiLogger {
  static logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const provider = this.detectProvider(url);

    const debugEnabled = !!process.env.NEXT_PUBLIC_ENABLE_API_DEBUG;

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

    store.dispatch(
      addApiLog({
        id,
        timestamp: new Date().toISOString(),
        method: init?.method || "GET",
        url,
        headers,
        requestBody,
        provider,
      }),
    );

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
    const debugEnabled = !!process.env.NEXT_PUBLIC_ENABLE_API_DEBUG;

    if (!debugEnabled) {
      Logger.debug(
        "[ApiLogger]",
        `Response ${response.status} for request ${id}`,
        responseBody,
      );
      return;
    }

    store.dispatch(
      updateApiLog({
        id,
        updates: {
          responseStatus: response.status,
          responseBody,
          duration,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        },
      }),
    );

    Logger.debug(
      "[ApiLogger]",
      `Response ${response.status} for request ${id}`,
      responseBody,
    );
  }

  static logError(id: string, error: unknown) {
    const debugEnabled = !!process.env.NEXT_PUBLIC_ENABLE_API_DEBUG;

    if (!debugEnabled) {
      Logger.error("[ApiLogger]", `Error for request ${id}`, error);
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    store.dispatch(
      updateApiLog({
        id,
        updates: {
          error: errorMessage,
        },
      }),
    );

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
