import { APIError } from "./utils";
import { Provider, type ProviderType } from "@/lib/constants/enums";

/**
 * Error class thrown when API requests fail due to missing or expired
 * authentication.
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

/**
 * Patterns used to detect authentication related messages from API responses.
 */
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
 * Determine whether the provided error indicates an authentication failure.
 */
export function isAuthenticationError(
  error: unknown
): error is AuthenticationError {
  if (error instanceof AuthenticationError) return true;

  if (error instanceof APIError) {
    if (
      error.status === 401 ||
      error.code === "401" ||
      Number(error.code) === 401
    ) {
      return true;
    }

    if (error.message) {
      const errorMessage = error.message.toLowerCase();
      return (
        AUTH_ERROR_PATTERNS.google.some((pattern) => pattern.test(errorMessage)) ||
        AUTH_ERROR_PATTERNS.microsoft.some((pattern) =>
          pattern.test(errorMessage)
        )
      );
    }
  }

  return false;
}

/**
 * Wrap an unknown error into an `AuthenticationError` for consistent handling.
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

export { AUTH_ERROR_PATTERNS };
