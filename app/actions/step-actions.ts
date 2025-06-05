"use server";

import { auth } from "@/app/(auth)/auth";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { ApiLogger } from "@/lib/api/api-logger";
import type { StepId } from "@/lib/steps/step-refs";
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
  StepDefinition,
} from "@/lib/types";

async function getStep(stepId: StepId): Promise<StepDefinition | undefined> {
  const { allStepDefinitions } = await import("@/lib/steps");
  return allStepDefinitions.find((s) => s.id === stepId);
}

async function validateSession(): Promise<{
  valid: boolean;
  error?: StepCheckResult;
}> {
  const session = await auth();
  if (!session?.user || !session.googleToken || !session.microsoftToken) {
    return {
      valid: false,
      error: {
        completed: false,
        message: "Your session is invalid. Please sign in to both services.",
        outputs: { errorCode: "AUTH_EXPIRED", requiresFullReauth: true },
      },
    };
  }
  return { valid: true };
}

export async function executeStepCheck(
  stepId: StepId,
  context: StepContext,
): Promise<StepCheckResult> {
  const logger = new ApiLogger();
  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid) return sessionValidation.error!;

    const step = await getStep(stepId);
    if (!step?.check) {
      return { completed: false, message: "No check logic for this step." };
    }

    const result = await step.check({ ...context, logger });
    const enrichedResult = {
      ...result,
      outputs: {
        ...(result.outputs || {}),
        inputs: step.inputs ?? [],
        expectedOutputs: step.outputs ?? [],
      },
      apiLogs: logger.getLogs(),
    };
    return enrichedResult;
  } catch (error) {
    console.error(`[StepCheck] Unhandled exception for step ${stepId}:`, error);
    if (isAuthenticationError(error)) {
      return {
        completed: false,
        message: error.message,
        outputs: { errorCode: "AUTH_EXPIRED", errorProvider: error.provider },
      };
    }
    return {
      completed: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred.",
      outputs: {
        errorCode: "UNKNOWN_CHECK_ERROR",
        errorMessage: String(error),
      },
    };
  }
}

export async function executeStepAction(
  stepId: StepId,
  context: StepContext,
): Promise<StepExecutionResult> {
  const logger = new ApiLogger();
  context.logger = logger;

  try {
    const sessionValidation = await validateSession();
    if (!sessionValidation.valid && sessionValidation.error) {
      logger.addLog("[StepAction] Session validation failed.");
      return {
        success: false,
        error: {
          message: sessionValidation.error.message || "Authentication required",
          code: "AUTH_EXPIRED",
        },
        outputs: sessionValidation.error.outputs,
        apiLogs: logger.getLogs(),
      };
    }

    const step = await getStep(stepId);
    if (!step?.execute) {
      return {
        success: false,
        error: {
          message: "No execution logic for this step.",
          code: "NO_EXECUTE_FUNCTION",
        },
        apiLogs: logger.getLogs(),
      };
    }

    const result = await step.execute(context);
    result.apiLogs = logger.getLogs();
    return result;
  } catch (error) {
    logger.addLog(
      `[StepAction] Unhandled exception for step ${stepId}: ${error}`,
    );
    const isAuthError = isAuthenticationError(error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "An unknown error occurred.",
        code: isAuthError ? "AUTH_EXPIRED" : "EXECUTION_ERROR",
      },
      outputs: {
        errorCode: isAuthError ? "AUTH_EXPIRED" : "EXECUTION_ERROR",
        errorMessage: String(error),
        errorProvider: isAuthError ? error.provider : undefined,
      },
      apiLogs: logger.getLogs(),
    };
  }
}
