"use server";

import { auth } from "@/app/(auth)/auth";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types";
import { checkStep, executeStep } from "@/lib/steps/registry";
import type { StepId } from "@/lib/steps/step-refs";
import { ApiLogger } from "@/lib/api/api-logger";
import { getLogCollector, clearLogCollector } from "@/lib/api/log-collector";

async function validateSession(): Promise<{ valid: boolean; error?: StepCheckResult }> {
  const session = await auth();

  if (!session) {
    return {
      valid: false,
      error: {
        completed: false,
        message: "No active session. Please sign in.",
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: "both",
        },
      },
    };
  }

  if ((session.error as unknown as string) === 'MissingTokens' || session.error === 'RefreshTokenError') {
    return {
      valid: false,
      error: {
        completed: false,
        message: "Your session is invalid. Please sign out and sign in again with both Google and Microsoft.",
        outputs: {
          errorCode: "INVALID_SESSION",
          errorProvider: "both",
          requiresFullReauth: true,
        },
      },
    };
  }

  if (!session.googleToken || !session.hasGoogleAuth) {
    return {
      valid: false,
      error: {
        completed: false,
        message: "Google authentication required. Please sign in with Google.",
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: "google",
        },
      },
    };
  }

  if (!session.microsoftToken || !session.hasMicrosoftAuth) {
    return {
      valid: false,
      error: {
        completed: false,
        message:
          "Microsoft authentication required. Please sign in with Microsoft.",
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: "microsoft",
        },
      },
    };
  }

  return { valid: true };
}
export async function executeStepCheck(
  stepId: StepId,
  context: StepContext,
): Promise<StepCheckResult> {
  const requestId = `check-${stepId}-${Date.now()}`;
  ApiLogger.setRequestId(requestId);

  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid) {
      return sessionValidation.error!;
    }

    const result = await checkStep(stepId, context);

    const collector = getLogCollector(requestId);
    const apiLogs = collector.getLogs();

    return {
      ...result,
      apiLogs,
    };
  } catch (error) {
    // For authentication errors, return a proper StepCheckResult instead of throwing
    if (isAuthenticationError(error)) {
      return {
        completed: false,
        message: error.message,
        outputs: {
          errorCode: "AUTH_EXPIRED",
          errorProvider: error.provider,
          errorMessage: error.message,
        },
      };
    }

    // For other errors, convert to StepCheckResult
    if (error instanceof Error) {
      return {
        completed: false,
        message: error.message,
        outputs: {
          errorCode: "UNKNOWN_ERROR",
          errorMessage: error.message,
        },
      };
    }

    // Fallback for non-Error objects
    return {
      completed: false,
      message: "Something went wrong. Please try again.",
      outputs: {
        errorCode: "UNKNOWN_ERROR",
        errorMessage: String(error),
      },
    };
  }
  finally {
    clearLogCollector(requestId);
    ApiLogger.clearRequestId();
  }
}

export async function executeStepAction(
  stepId: StepId,
  context: StepContext,
): Promise<StepExecutionResult> {
  const requestId = `execute-${stepId}-${Date.now()}`;
  ApiLogger.setRequestId(requestId);

  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid && sessionValidation.error) {
      return {
        success: false,
        error: {
          message: sessionValidation.error.message || "Authentication required",
          code: "AUTH_EXPIRED",
        },
        outputs: sessionValidation.error.outputs,
      };
    }

    const result = await executeStep(stepId, context);

    const collector = getLogCollector(requestId);
    const apiLogs = collector.getLogs();

    return {
      ...result,
      apiLogs,
    };
  } finally {
    clearLogCollector(requestId);
    ApiLogger.clearRequestId();
  }
}
