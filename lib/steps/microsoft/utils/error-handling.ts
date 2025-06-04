import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { APIError } from "@/lib/api/utils";
import type { StepCheckResult, StepExecutionResult } from "@/lib/types";

export function handleCheckError(error: unknown, defaultMessage: string): StepCheckResult {
  console.error(`Check Action Error - ${defaultMessage}:`, error);

  if (isAuthenticationError(error)) {
    throw error;
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

export async function handleExecutionError(error: unknown, stepId: string): Promise<StepExecutionResult> {
  console.error(`Execution Action Failed (Step ${stepId}):`, error);

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
    return { success: false, error: { message: error.message, code: error.code } };
  }

  const message =
    error instanceof Error
      ? error.message
      : "An unknown error occurred during execution.";

  return { success: false, error: { message, code: "UNKNOWN_ERROR" } };
}
