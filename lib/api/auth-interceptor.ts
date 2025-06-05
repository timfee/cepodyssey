import { auth } from "@/app/(auth)/auth";
import { Provider, type ProviderType } from "@/lib/constants/enums";
import { ApiLogger } from "./api-logger";
import { APIError, withRetry } from "./utils";

/**
 * Custom error used when API requests fail due to expired or missing
 * authentication. The original error is preserved for debugging.
 */
export class AuthenticationError extends APIError {
  constructor(
    message: string,
    public provider: ProviderType,
    public originalError?: unknown
  ) {
    super(message, 401, "AUTH_EXPIRED");
    this.name = "AuthenticationError";
  }
}

// More comprehensive error patterns
const AUTH_ERROR_PATTERNS = {
  google: [
    /invalid authentication credentials/i,
    /OAuth 2 access token/i,
    /login cookie or other valid authentication credential/i,
    /Token has been expired or revoked/i,
    /Request had insufficient authentication scopes/i,
    /401 Unauthorized/i,
  ],
  microsoft: [
    /InvalidAuthenticationToken/i,
    /Access token validation failure/i,
    /Token expired/i,
    /CompactToken parsing failed/i,
    /unauthorized_client/i,
    /invalid_grant/i,
  ],
} as const;

/**
 * Type guard for detecting authentication-related failures.
 */
export function isAuthenticationError(
  error: unknown
): error is AuthenticationError {
  if (error instanceof AuthenticationError) return true;

  if (error instanceof APIError) {
    // Check numeric and string status codes
    if (
      error.status === 401 ||
      error.code === "401" ||
      Number(error.code) === 401
    ) {
      return true;
    }

    // Check error message patterns
    if (error.message) {
      const errorMessage = error.message.toLowerCase();
      return (
        AUTH_ERROR_PATTERNS.google.some((pattern) =>
          pattern.test(errorMessage)
        ) ||
        AUTH_ERROR_PATTERNS.microsoft.some((pattern) =>
          pattern.test(errorMessage)
        )
      );
    }
  }

  return false;
}

/**
 * Normalize any error into an `AuthenticationError` instance so callers
 * can handle them consistently.
 */
export function wrapAuthError(
  error: unknown,
  provider: ProviderType
): AuthenticationError {
  if (error instanceof APIError && error.status === 401) {
    return new AuthenticationError(
      `${provider === Provider.GOOGLE ? "Google Workspace" : "Microsoft"} authentication expired. Please sign in again.`,
      provider,
      error
    );
  }
  return new AuthenticationError(
    `Authentication failed for ${provider}. Please sign in again.`,
    provider,
    error
  );
}
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
