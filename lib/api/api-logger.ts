import { isApiDebugEnabled } from "@/lib/utils";
import { config } from "@/lib/config";
import { serverLogger } from "@/lib/logging/server-logger";
import { Logger } from "@/lib/utils/logger";
import { randomUUID } from "crypto";

/**
 * Collects request and response metadata during server actions. Logs are
 * streamed to the client for debugging when API debug mode is enabled.
 */
export class ApiLogger {
  /**
   * Add an arbitrary log message.
   */
  addLog(message: string) {
    if (!isApiDebugEnabled()) return;
    serverLogger
      .log({
        level: 'info',
        category: 'system',
        metadata: { error: message },
      })
      .catch(() => {});
  }

  logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${randomUUID()}`;
    const provider = this.detectProvider(url);

    Logger.info('[ApiLogger]', `[API Request] ${init?.method || 'GET'} ${url}`);
    if (isApiDebugEnabled()) {
      serverLogger
        .log({
          level: 'info',
          category: 'api',
          provider,
          metadata: {
            method: init?.method || 'GET',
            url,
            requestBody:
              init?.body && typeof init.body === 'string'
                ? JSON.parse(init.body)
                : undefined,
          },
        })
        .catch(() => {});
    }

    return id;
  }

  logResponse(
    _id: string,
    response: Response,
    responseBody?: unknown,
    duration?: number
  ) {
    Logger.info('[ApiLogger]', `[API Response] ${response.status} in ${duration}ms`);
    if (!isApiDebugEnabled()) return;

    serverLogger
      .log({
      level: response.ok ? 'info' : 'error',
      category: 'api',
      metadata: {
        url: response.url,
        status: response.status,
        responseBody,
        duration,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      },
      })
      .catch(() => {});
  }

  logError(_id: string, error: unknown) {
    Logger.error('[ApiLogger]', '[API Error]', error);
    if (!isApiDebugEnabled()) return;

    serverLogger
      .log({
      level: 'error',
      category: 'api',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
      })
      .catch(() => {});
  }

  private detectProvider(url: string): 'google' | 'microsoft' | undefined {
    if (
      url.startsWith(config.GOOGLE_API_BASE) ||
      url.startsWith(config.GOOGLE_IDENTITY_BASE)
    )
      return "google";
    if (url.startsWith(config.GRAPH_API_BASE)) return "microsoft";
    return undefined;
  }
}
