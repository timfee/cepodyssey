import { allStepDefinitions } from './index';
import type {
  StepCheckResult,
  StepContext,
  StepExecutionResult,
  StepDefinition,
  StepInput,
  StepOutput,
} from '@/lib/types';
import type { StepId } from './step-refs';
import { ApiLogger } from '@/lib/api/api-logger';

export const STEPS: Record<StepId, StepDefinition> = {} as Record<
  StepId,
  StepDefinition
>;
allStepDefinitions.forEach((step) => {
  STEPS[step.id as StepId] = step;
});

export function getStep(stepId: StepId): StepDefinition {
  const step = STEPS[stepId];
  if (!step) {
    throw new Error(`Step ${stepId} not found in registry`);
  }
  return step;
}

export function getStepInputs(stepId: StepId): StepInput[] {
  return getStep(stepId).inputs || [];
}

export function getStepOutputs(stepId: StepId): StepOutput[] {
  return getStep(stepId).outputs || [];
}

export async function checkStep(
  stepId: StepId,
  context: StepContext,
): Promise<StepCheckResult> {
  const step = getStep(stepId);
  if (!step.check) {
    return { completed: false, message: 'No check available for this step.' };
  }
  const logger = new ApiLogger();
  const result = await step.check({ ...context, logger });
  return {
    ...result,
    apiLogs: logger.getLogs(),
  };
}

export async function executeStep(
  stepId: StepId,
  context: StepContext,
): Promise<StepExecutionResult> {
  const step = getStep(stepId);
  if (!step.execute) {
    return {
      success: false,
      error: {
        message: 'No execution available for this step.',
        code: 'NO_EXECUTE_FUNCTION',
      },
    };
  }
  const logger = new ApiLogger();
  const result = await step.execute({ ...context, logger });
  return {
    ...result,
    apiLogs: logger.getLogs(),
  };
}
