import { ErrorManager, ManagedError } from "@/lib/error-handling/error-manager";

export interface ErrorContext {
  stepId?: string;
  stepTitle?: string;
  action?: string;
}

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: ManagedError;
}

export async function withErrorBoundary<T>(
  operation: () => Promise<T>,
  context: ErrorContext = {},
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    ErrorManager.dispatch(error, { stepId: context.stepId, stepTitle: context.stepTitle });
    const managed = ErrorManager.handle(error, {
      stepId: context.stepId,
      stepTitle: context.stepTitle,
    });
    return { success: false, error: managed };
  }
}

