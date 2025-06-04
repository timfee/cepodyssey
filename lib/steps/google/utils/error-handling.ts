import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";
import type { StepCheckResult, StepExecutionResult } from "@/lib/types";
import { Logger } from "@/lib/utils/logger";

export function handleCheckError(
  error: unknown,
  defaultMessage: string
): StepCheckResult {
  Logger.error("[Step]", `Check failed - ${defaultMessage}`, error);

  if (isAuthenticationError(error)) {
    throw error; // Propagate auth errors to be handled by the UI
  }

  if (error instanceof APIError) {
    return {
      completed: false,
      message: error.message,
      outputs: {
        errorCode: error.code,
        errorMessage: error.message,
        errorStatus: error.status,
      },
    };
  }

  const message = error instanceof Error ? error.message : defaultMessage;
  return {
    completed: false,
    message,
    outputs: {
      errorCode: "UNKNOWN_ERROR",
      errorMessage: message,
    },
  };
}

export async function handleExecutionError(
  error: unknown,
  stepId: string
): Promise<StepExecutionResult> {
  Logger.error("[Step]", `Execution failed for step ${stepId}`, error);

  if (isAuthenticationError(error)) {
    return {
      success: false,
      error: {
        message: error.message,
        code: "AUTH_EXPIRED",
      },
      outputs: {
        errorCode: "AUTH_EXPIRED",
        errorProvider: error.provider,
      },
    };
  }

  if (error instanceof APIError) {
    return {
      success: false,
      error: { message: error.message, code: error.code },
    };
  }

  const message =
    error instanceof Error
      ? error.message
      : "An unknown error occurred during execution.";

  return { success: false, error: { message, code: "UNKNOWN_ERROR" } };
}
