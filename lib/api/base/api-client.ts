import { ApiLogger } from "../api-logger";
import { fetchWithAuth } from "../auth-interceptor";
import { APIError, handleApiResponse } from "../utils";
import type { ApiClientConfig, RequestConfig } from "./types";

export function createApiClient(config: ApiClientConfig) {
  return {
    async request<T>(
      url: string,
      options: RequestConfig = {},
      logger?: ApiLogger,
    ): Promise<T> {
      try {
        const response = await fetchWithAuth(
          url,
          {
            method: options.method || "GET",
            body: options.body ? JSON.stringify(options.body) : undefined,
            headers: {
              "Content-Type": "application/json",
              ...options.headers,
            },
          },
          config.provider,
          logger,
        );

        return (await handleApiResponse<T>(response)) as T;
      } catch (error) {
        config.handleProviderError(error);
      }
      // Should never reach here
      throw new APIError("Unhandled provider error", 500);
    },

    get<T>(url: string, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "GET" }, logger);
    },

    post<T>(url: string, body: unknown, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "POST", body }, logger);
    },

    patch<T>(url: string, body: unknown, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "PATCH", body }, logger);
    },

    put<T>(url: string, body: unknown, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "PUT", body }, logger);
    },
  };
}
