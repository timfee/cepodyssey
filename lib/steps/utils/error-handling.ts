import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";
import { serverLogger } from "@/lib/logging/server-logger";
import { ErrorManager } from "@/lib/error-handling/error-manager";
import { Logger } from "@/lib/utils/logger";
import type { StepCheckResult, StepExecutionResult } from "@/lib/types";
import { Provider } from "@/lib/constants/enums";

export function handleCheckError(
  error: unknown,
  defaultMessage: string,
): StepCheckResult {
  Logger.error('[StepError]', `Check Action Error - ${defaultMessage}:`, error);

  // eslint-disable-next-line promise/no-promise-in-callback
  serverLogger
    .log({
      level: "error",
      category: "step",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        stepId: defaultMessage,
      },
    })
    .catch(() => {});

  if (isAuthenticationError(error)) {
    // Dispatch the auth error to the global error handler
    ErrorManager.dispatch(error, { stepTitle: defaultMessage });

    // eslint-disable-next-line promise/no-promise-in-callback
    serverLogger
      .log({
        level: "error",
        category: "auth",
        provider: error.provider === Provider.GOOGLE ? "google" : "microsoft",
        metadata: {
          error: `Authentication Error: ${error.message}`,
        },
      })
      .catch(() => {});

    // Return auth error result
    return {
      completed: false,
      message: error.message,
      outputs: {
        errorCode: "AUTH_EXPIRED",
        errorProvider: error.provider,
        requiresReauth: true,
      },
    };
  }

  const managed = ErrorManager.handle(error);
  return {
    completed: false,
    message: managed.message,
    outputs: {
      errorCode: managed.code || "UNKNOWN_ERROR",
      errorMessage: managed.message,
      errorCategory: managed.category,
    },
  };
}

export async function handleExecutionError(
  error: unknown,
  stepId: string,
): Promise<StepExecutionResult> {
  Logger.error('[StepError]', `Execution Action Failed (Step ${stepId}):`, error);

  if (isAuthenticationError(error)) {
    return {
      success: false,
      error: { message: error.message, code: "AUTH_EXPIRED" },
      outputs: { errorCode: "AUTH_EXPIRED", errorProvider: error.provider },
    };
  }

  if (error instanceof APIError) {
    return {
      success: false,
      error: { message: error.message, code: error.code },
    };
  }

  const managed = ErrorManager.handle(error, { stepId });
  return {
    success: false,
    error: { message: managed.message, code: managed.code || "UNKNOWN_ERROR" },
    outputs: {
      errorCode: managed.code || "UNKNOWN_ERROR",
      errorProvider: managed.provider,
      errorCategory: managed.category,
    },
  };
}
