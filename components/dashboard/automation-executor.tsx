"use client";
import React from "react";
import { ProgressVisualizer } from "@/components/progress";
import type { StepId } from "@/lib/steps/step-refs";

interface AutomationExecutorProps {
  onExecuteStep: (stepId: StepId) => void;
}

export function AutomationExecutor({ onExecuteStep }: AutomationExecutorProps) {
  return <ProgressVisualizer onExecuteStep={onExecuteStep} />;
}
