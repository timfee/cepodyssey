import { auth } from "@/app/(auth)/auth";

export interface SessionValidation {
  valid: boolean;
  googleValid: boolean;
  microsoftValid: boolean;
  error?: {
    provider: "google" | "microsoft" | "both";
    message: string;
    code?: string;
  };
}

export async function validateSessionTokens(): Promise<SessionValidation> {
  try {
    const session = await auth();

    if (!session) {
      return {
        valid: false,
        googleValid: false,
        microsoftValid: false,
        error: {
          provider: "both",
          message: "No session found",
        },
      };
    }

    // Check for explicit refresh token errors
    if (session.error === "RefreshTokenError") {
      const missingProvider = !session.googleToken
        ? !session.microsoftToken
          ? "both"
          : "google"
        : "microsoft";

      return {
        valid: false,
        googleValid: !!session.googleToken,
        microsoftValid: !!session.microsoftToken,
        error: {
          provider: missingProvider,
          message: "Session expired - refresh failed",
          code: "REFRESH_TOKEN_ERROR",
        },
      };
    }

    // Validate individual tokens
    const googleValid = !!session.googleToken && session.hasGoogleAuth;
    const microsoftValid = !!session.microsoftToken && session.hasMicrosoftAuth;

    if (!googleValid || !microsoftValid) {
      const missingProvider = !googleValid
        ? !microsoftValid
          ? "both"
          : "google"
        : "microsoft";

      return {
        valid: false,
        googleValid,
        microsoftValid,
        error: {
          provider: missingProvider,
          message:
            missingProvider === "both"
              ? "Both providers authentication required"
              : missingProvider === "google"
                ? "Google Workspace authentication required"
                : "Microsoft authentication required",
          code: "AUTH_MISSING",
        },
      };
    }

    return {
      valid: true,
      googleValid: true,
      microsoftValid: true,
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return {
      valid: false,
      googleValid: false,
      microsoftValid: false,
      error: {
        provider: "both",
        message: "Failed to validate session",
        code: "VALIDATION_ERROR",
      },
    };
  }
}
