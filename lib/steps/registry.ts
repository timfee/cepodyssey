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

export function getStep(
  allSteps: StepDefinition[],
  stepId: StepId,
): StepDefinition | undefined {
  return allSteps.find((s) => s.id === stepId);
}

export function getStepInputs(
  allSteps: StepDefinition[],
  stepId: StepId,
): StepInput[] {
  return getStep(allSteps, stepId)?.inputs || [];
}

export function getStepOutputs(
  allSteps: StepDefinition[],
  stepId: StepId,
): StepOutput[] {
  return getStep(allSteps, stepId)?.outputs || [];
}

export async function checkStep(
  allSteps: StepDefinition[],
  stepId: StepId,
  context: StepContext,
): Promise<StepCheckResult> {
  const step = getStep(allSteps, stepId);
  if (!step?.check) {
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
  allSteps: StepDefinition[],
  stepId: StepId,
  context: StepContext,
): Promise<StepExecutionResult> {
  const step = getStep(allSteps, stepId);
  if (!step?.execute) {
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
