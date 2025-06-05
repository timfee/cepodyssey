import { isApiDebugEnabled } from '@/lib/utils';
import { serverLogger } from '@/lib/logging/server-logger';

export class ApiLogger {
  /**
   * Add an arbitrary log message.
   */
  addLog(message: string) {
    if (!isApiDebugEnabled()) return;
    void serverLogger.log({
      level: 'info',
      category: 'system',
      metadata: { error: message },
    });
  }

  logRequest(url: string, init?: RequestInit): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const provider = this.detectProvider(url);

    console.log(`[API Request] ${init?.method || 'GET'} ${url}`);
    if (!isApiDebugEnabled()) return id;

    void serverLogger.log({
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
    });

    return id;
  }

  logResponse(
    _id: string,
    response: Response,
    responseBody?: unknown,
    duration?: number
  ) {
    console.log(`[API Response] ${response.status} in ${duration}ms`);
    if (!isApiDebugEnabled()) return;

    void serverLogger.log({
      level: response.ok ? 'info' : 'error',
      category: 'api',
      metadata: {
        url: response.url,
        status: response.status,
        responseBody,
        duration,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      },
    });
  }

  logError(_id: string, error: unknown) {
    console.error(`[API Error]`, error);
    if (!isApiDebugEnabled()) return;

    void serverLogger.log({
      level: 'error',
      category: 'api',
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
  }

  private detectProvider(url: string): 'google' | 'microsoft' | undefined {
    if (
      url.startsWith(process.env.GOOGLE_API_BASE!) ||
      url.startsWith(process.env.GOOGLE_IDENTITY_BASE!)
    )
      return 'google';
    if (url.startsWith(process.env.GRAPH_API_BASE!)) return 'microsoft';
    return undefined;
  }
}
