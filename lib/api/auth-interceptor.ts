import { auth } from "@/app/(auth)/auth";
import { Provider, type ProviderType } from "@/lib/constants/enums";
import { ApiLogger } from "./api-logger";
import { APIError, withRetry } from "./utils";
import {
  AuthenticationError,
  AUTH_ERROR_PATTERNS,
  isAuthenticationError,
  wrapAuthError,
} from "./auth-errors";

// Re-export auth error helpers for convenience
export {
  AuthenticationError,
  AUTH_ERROR_PATTERNS,
  isAuthenticationError,
  wrapAuthError,
} from "./auth-errors";
/**
 * Wrapper around `fetch` that automatically attaches the user's access
 * token and logs requests and responses.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  provider: ProviderType,
  logger?: ApiLogger
): Promise<Response> {
  const session = await auth();
  const token =
    provider === "google" ? session?.googleToken : session?.microsoftToken;

  if (!token) {
    throw new AuthenticationError(
      `No ${provider} access token found in session.`,
      provider
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const requestId = logger?.logRequest(url, { ...options, headers });

  try {
    const response = await withRetry(async () => {
      const res = await fetch(url, { ...options, headers });

      if (res.status === 401) {
        throw new AuthenticationError(
          `Authentication failed for ${provider}. Token likely expired.`,
          provider
        );
      }

      return res;
    });

    if (logger && requestId) {
      const responseBody = await response
        .clone()
        .json()
        .catch(() => null);
      logger.logResponse(requestId, response, responseBody, Date.now());
    }

    return response;
  } catch (error) {
    if (logger && requestId) {
      logger.logError(requestId, error);
    }
    throw error;
  }
}
