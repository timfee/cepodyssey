export type StepId = import("@/lib/steps/step-refs").StepId;

export type StepStatus = import("@/lib/types").StepStatusValue | "available";

export type StepCompletionType = "server-verified" | "user-marked" | null;
export type StepAutomatability = import("@/lib/types").AutomatabilityValue;

export type ManagedStep = import("@/lib/types").ManagedStep;

export interface DisplayInput {
  key: string | undefined;
  description?: string;
  currentValue: unknown;
  sourceStepTitle?: string;
}

export interface DisplayOutput {
  key: string;
  description?: string;
  currentValue: unknown;
}

export interface DisplayApiAction {
  method: string;
  path: string;
  isManual: boolean;
}

export interface WorkflowStepCardProps {
  step: ManagedStep;
  allOutputs: Record<string, unknown>;
  canRunGlobal: boolean;
  onExecute: (stepId: StepId) => void;
  stepInputDefs: Array<{
    data: { key?: string; description?: string };
    stepTitle?: string;
  }>;
  stepOutputDefs: Array<{ key: string; description?: string }>;
}
