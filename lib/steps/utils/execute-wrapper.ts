import type { StepExecutionResult, StepContext } from '@/lib/types';
import { handleExecutionError } from './error-handling';
import { validateRequiredOutputs } from './validation';
import type { StepId } from '../step-refs';

/**
 * A higher-order function that wraps a step's execution logic,
 * automatically handling input validation and try/catch error handling.
 */
export function withExecutionHandling({
  stepId,
  requiredOutputs,
  executeLogic,
}: {
  stepId: StepId;
  requiredOutputs: string[];
  executeLogic: (context: StepContext) => Promise<StepExecutionResult>;
}) {
  return async function (
    context: StepContext,
  ): Promise<StepExecutionResult> {
    try {
      // Handle boilerplate input validation
      const validation = validateRequiredOutputs(context, requiredOutputs, stepId);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Run the step's unique execution logic
      return await executeLogic(context);
    } catch (e) {
      // Handle boilerplate error catching
      return handleExecutionError(e, stepId);
    }
  };
}
