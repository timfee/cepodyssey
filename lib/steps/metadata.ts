import type { StepDefinition, StepInput, StepOutput } from '@/lib/types';
import type { StepId } from './step-refs';

/**
 * Retrieve a step definition by its identifier.
 */
export function getStep(allDefs: StepDefinition[], stepId: StepId): StepDefinition | undefined {
  return allDefs.find((s) => s.id === stepId);
}

/**
 * Return the list of required inputs for the specified step.
 */
export function getStepInputs(allDefs: StepDefinition[], stepId: StepId): StepInput[] {
  return getStep(allDefs, stepId)?.inputs ?? [];
}

/**
 * Return the outputs produced by the specified step.
 */
export function getStepOutputs(allDefs: StepDefinition[], stepId: StepId): StepOutput[] {
  return getStep(allDefs, stepId)?.outputs ?? [];
}
