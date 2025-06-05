export type StepId = import("@/lib/steps/step-refs").StepId;

import type { AutomatabilityType, StepStatusType } from "@/lib/constants/enums";

export type StepStatus = StepStatusType | "available";

export type StepCompletionType = "server-verified" | "user-marked" | null;
export type StepAutomatability = AutomatabilityType;

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
