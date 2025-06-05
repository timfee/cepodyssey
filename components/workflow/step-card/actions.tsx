"use client";

import { useMemo } from "react";
import type { ManagedStep } from "../workflow-types";
import {
  BlockedMessage,
  CompletedButtons,
  ExecutionButtons,
  ConfigureLink,
} from "./footer";

interface StepCardFooterActionsProps {
  step: ManagedStep;
  isBlocked: boolean;
  isCompleted: boolean;
  isProcessing: boolean;
  canExecute: boolean;
  allOutputs: Record<string, unknown>;
  onExecute: () => void;
  onMarkComplete: () => void;
  onMarkIncomplete: () => void;
  onRequestAdmin: () => void;
}

export function StepCardFooterActions({
  step,
  isBlocked,
  isCompleted,
  isProcessing,
  canExecute,
  allOutputs,
  onExecute,
  onMarkComplete,
  onMarkIncomplete,
  onRequestAdmin,
}: StepCardFooterActionsProps) {
  const configureUrl = useMemo(() => {
    if (!step.adminUrls?.configure) return undefined;
    if (typeof step.adminUrls.configure === "function") {
      return step.adminUrls.configure(allOutputs) || "#";
    }
    return step.adminUrls.configure;
  }, [step.adminUrls, allOutputs]);

  if (isBlocked) {
    return <BlockedMessage />;
  }

  const actionSection = isCompleted ? (
    <CompletedButtons
      step={step}
      isProcessing={isProcessing}
      onExecute={onExecute}
      onMarkIncomplete={onMarkIncomplete}
    />
  ) : (
    <ExecutionButtons
      step={step}
      isProcessing={isProcessing}
      canExecute={canExecute}
      onExecute={onExecute}
      onMarkComplete={onMarkComplete}
      onRequestAdmin={onRequestAdmin}
    />
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">{actionSection}</div>
      {configureUrl && <ConfigureLink url={configureUrl} />}
    </>
  );
}
