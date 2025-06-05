import { ApiLogger } from "../api-logger";
import { fetchWithAuth } from "../auth-interceptor";
import { APIError, handleApiResponse } from "../utils";
import type { ApiClientConfig, RequestConfig } from "./types";

/**
 * Creates an API client bound to a specific provider. Each helper method
 * automatically includes authentication and standard error handling.
 */
export function createApiClient(config: ApiClientConfig) {
  return {
    /** Generic request helper used by the convenience methods. */
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

        if (options.responseType === "text") {
          if (!response.ok) {
            throw new APIError(
              `Request failed with status ${response.status}`,
              response.status,
            );
          }
          return (await response.text()) as T;
        }

        return (await handleApiResponse<T>(response)) as T;
      } catch (error) {
        config.handleProviderError(error);
      }
      // Should never reach here
      throw new APIError("Unhandled provider error", 500);
    },

    /** Perform a GET request. */
    get<T>(url: string, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "GET" }, logger);
    },

    /** Perform a POST request. */
    post<T>(url: string, body: unknown, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "POST", body }, logger);
    },

    /** Perform a PATCH request. */
    patch<T>(url: string, body: unknown, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "PATCH", body }, logger);
    },

    /** Perform a PUT request. */
    put<T>(url: string, body: unknown, logger?: ApiLogger): Promise<T> {
      return this.request<T>(url, { method: "PUT", body }, logger);
    },
  };
}
