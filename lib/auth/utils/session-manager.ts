import { APIError } from "@/lib/api/utils";
import { auth, cleanupInvalidSession } from "@/lib/auth";
import { HTTP_STATUS_UNAUTHORIZED } from "@/lib/constants/http-status";
import { Logger } from "@/lib/utils/logger";
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
          error: {
            provider: "both",
            message: "No session found",
            code: "NO_SESSION",
          },
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
      const microsoftValid =
        !!session.microsoftToken && session.hasMicrosoftAuth;
      if (!googleValid || !microsoftValid) {
        let missingProvider: "google" | "microsoft" | "both";
        if (!googleValid && !microsoftValid) {
          missingProvider = "both";
        } else if (!googleValid) {
          missingProvider = "google";
        } else {
          missingProvider = "microsoft";
        }

        let message;
        if (missingProvider === "both") {
          message = "Both providers authentication required";
        } else if (missingProvider === "google") {
          message = "Please sign in with Google";
        } else {
          message = "Please sign in with Microsoft";
        }

        return {
          valid: false,
          googleValid,
          microsoftValid,
          error: {
            provider: missingProvider,
            message,
            code: "AUTH_MISSING",
          },
        };
      }
      return { valid: true, googleValid: true, microsoftValid: true };
    } catch (error) {
      Logger.error("[SessionManager]", "Session validation error:", error);
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

  static async requireBothProviders(): Promise<ValidSession> {
    const validation = await this.validate();
    if (!validation.valid) {
      throw new APIError(
        validation.error?.message ?? "Authentication required",
        HTTP_STATUS_UNAUTHORIZED,
        validation.error?.code
      );
    }
    return (await auth()) as ValidSession;
  }

  static async refreshIfNeeded(
    updateFn?: () => Promise<Session | null>
  ): Promise<boolean> {
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
