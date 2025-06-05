import { APIError } from "./utils";
import { auth } from "@/app/(auth)/auth";
import { ApiLogger } from "./api-logger";
import type { ProviderValue } from "@/lib/types";
import { Provider } from "@/lib/constants/enums";

export class AuthenticationError extends APIError {
  constructor(
    message: string,
    public provider: ProviderValue,
    public originalError?: unknown,
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

export function isAuthenticationError(
  error: unknown,
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
          pattern.test(errorMessage),
        ) ||
        AUTH_ERROR_PATTERNS.microsoft.some((pattern) =>
          pattern.test(errorMessage),
        )
      );
    }
  }

  return false;
}

export function wrapAuthError(
  error: unknown,
  provider: ProviderValue,
): AuthenticationError {
  if (error instanceof APIError && error.status === 401) {
    return new AuthenticationError(
      `${provider === Provider.GOOGLE ? "Google Workspace" : "Microsoft"} authentication expired. Please sign in again.`,
      provider,
      error,
    );
  }
  return new AuthenticationError(
    `Authentication failed for ${provider}. Please sign in again.`,
    provider,
    error,
  );
}
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  provider: ProviderValue,
  logger?: ApiLogger,
): Promise<Response> {
  const session = await auth();

  // Select the correct token based on the provider
  const token =
    provider === Provider.GOOGLE ? session?.googleToken : session?.microsoftToken;

  if (!token) {
    throw new AuthenticationError(
      `No ${provider} access token found in session.`,
      provider,
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const optionsWithAuth: RequestInit = { ...options, headers };

  logger?.addLog(`[[Auth]] Making authenticated request to ${url}`);
  const response = await fetch(url, optionsWithAuth);

  // If the response is a 401, throw a specific error.
  // The UI will catch this and prompt for re-authentication.
  if (response.status === 401) {
    logger?.addLog(`[[Auth]] Received 401 Unauthorized for ${url}`);
    throw new AuthenticationError(
      `Authentication failed for ${provider}. The token is likely expired.`,
      provider,
    );
  }

  return response;
}
