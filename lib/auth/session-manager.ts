import { auth, cleanupInvalidSession } from "@/app/(auth)/auth";
import { APIError } from "@/lib/api/utils";
import type { Session } from "next-auth";

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

export interface ValidSession extends Session {
  googleToken: string;
  microsoftToken: string;
}

export class SessionManager {
  static async validate(): Promise<SessionValidation> {
    try {
      const session = await auth();
      if (!session) {
        return {
          valid: false,
          googleValid: false,
          microsoftValid: false,
          error: { provider: "both", message: "No session found", code: "NO_SESSION" },
        };
      }
      if (session.error === "RefreshTokenError") {
        return {
          valid: false,
          googleValid: false,
          microsoftValid: false,
          error: {
            provider: "both",
            message: "Session expired - refresh failed",
            code: "REFRESH_TOKEN_ERROR",
          },
        };
      }
      const googleValid = !!session.googleToken && session.hasGoogleAuth;
      const microsoftValid = !!session.microsoftToken && session.hasMicrosoftAuth;
      if (!googleValid || !microsoftValid) {
        const missingProvider = !googleValid ? (!microsoftValid ? "both" : "google") : "microsoft";
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
                  ? "Please sign in with Google"
                  : "Please sign in with Microsoft",
            code: "AUTH_MISSING",
          },
        };
      }
      return { valid: true, googleValid: true, microsoftValid: true };
    } catch (error) {
      console.error("Session validation error:", error);
      return {
        valid: false,
        googleValid: false,
        microsoftValid: false,
        error: { provider: "both", message: "Failed to validate session", code: "VALIDATION_ERROR" },
      };
    }
  }

  static async requireBothProviders(): Promise<ValidSession> {
    const validation = await this.validate();
    if (!validation.valid) {
      throw new APIError(validation.error?.message ?? "Authentication required", 401, validation.error?.code);
    }
    return (await auth()) as ValidSession;
  }

  static async refreshIfNeeded(updateFn?: () => Promise<Session | null>): Promise<boolean> {
    if (updateFn) {
      const updated = await updateFn();
      return updated?.error !== "RefreshTokenError";
    }
    const session = await auth();
    if (session?.error === "RefreshTokenError") {
      await cleanupInvalidSession();
      return false;
    }
    return true;
  }
}
