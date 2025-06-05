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
  allDefs: StepDefinition[],
  stepId: StepId,
): StepDefinition | undefined {
  return allDefs.find((s) => s.id === stepId);
}

export function getStepInputs(
  allDefs: StepDefinition[],
  stepId: StepId,
): StepInput[] {
  return getStep(allDefs, stepId)?.inputs ?? [];
}

export function getStepOutputs(
  allDefs: StepDefinition[],
  stepId: StepId,
): StepOutput[] {
  return getStep(allDefs, stepId)?.outputs ?? [];
}

export async function checkStep(
  allDefs: StepDefinition[],
  stepId: StepId,
  context: StepContext,
): Promise<StepCheckResult> {
  const step = getStep(allDefs, stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found in registry`);
  }
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
  allDefs: StepDefinition[],
  stepId: StepId,
  context: StepContext,
): Promise<StepExecutionResult> {
  const step = getStep(allDefs, stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found in registry`);
  }
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
