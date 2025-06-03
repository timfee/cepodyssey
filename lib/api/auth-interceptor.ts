import { APIError } from "./utils";

export class AuthenticationError extends APIError {
  constructor(
    message: string,
    public provider: "google" | "microsoft",
    public originalError?: unknown,
  ) {
    super(message, 401, "AUTH_EXPIRED");
    this.name = "AuthenticationError";
  }
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return (
    error instanceof AuthenticationError ||
    (error instanceof APIError &&
      (error.status === 401 ||
        error.message?.includes("invalid authentication credentials") ||
        error.message?.includes("OAuth 2 access token")))
  );
}

export function wrapAuthError(error: unknown, provider: "google" | "microsoft"): AuthenticationError {
  if (error instanceof APIError && error.status === 401) {
    return new AuthenticationError(
      `${provider === "google" ? "Google Workspace" : "Microsoft"} authentication expired. Please sign in again.`,
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
