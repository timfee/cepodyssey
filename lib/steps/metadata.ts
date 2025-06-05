import type { StepDefinition, StepInput, StepOutput } from '@/lib/types';
import type { StepId } from './step-refs';

export function getStep(allDefs: StepDefinition[], stepId: StepId): StepDefinition | undefined {
  return allDefs.find((s) => s.id === stepId);
}

export function getStepInputs(allDefs: StepDefinition[], stepId: StepId): StepInput[] {
  return getStep(allDefs, stepId)?.inputs ?? [];
}

export function getStepOutputs(allDefs: StepDefinition[], stepId: StepId): StepOutput[] {
  return getStep(allDefs, stepId)?.outputs ?? [];
}
