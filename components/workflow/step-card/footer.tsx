"use client";

import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  UserCheck,
  Zap,
} from "lucide-react";
import type { ManagedStep } from "../workflow-types";
import { Automatability, StepStatus } from "@/lib/constants/enums";

export function BlockedMessage() {
  return (
    <div className="flex items-center text-sm text-muted-foreground">
      <Lock className="mr-1.5 h-4 w-4 shrink-0" />
      <span>Complete prerequisite steps first.</span>
    </div>
  );
}

interface CompletedButtonsProps {
  step: ManagedStep;
  isProcessing: boolean;
  onExecute: () => void;
  onMarkIncomplete: () => void;
}

export function CompletedButtons({
  step,
  isProcessing,
  onExecute,
  onMarkIncomplete,
}: CompletedButtonsProps) {
  return (
    <>
      {step.automatability !== Automatability.MANUAL && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExecute}
          disabled={isProcessing}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Re-run
        </Button>
      )}
      {step.automatability === Automatability.MANUAL &&
        step.completionType === "user-marked" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkIncomplete}
            disabled={isProcessing}
          >
            Mark as Incomplete
          </Button>
        )}
    </>
  );
}

interface ExecutionButtonsProps {
  step: ManagedStep;
  isProcessing: boolean;
  canExecute: boolean;
  onExecute: () => void;
  onMarkComplete: () => void;
  onRequestAdmin: () => void;
}

export function ExecutionButtons({
  step,
  isProcessing,
  canExecute,
  onExecute,
  onMarkComplete,
  onRequestAdmin,
}: ExecutionButtonsProps) {
  return (
    <>
      <Button
        size="sm"
        onClick={
          step.automatability !== Automatability.MANUAL
            ? onExecute
            : onMarkComplete
        }
        disabled={!canExecute || isProcessing}
        variant={
          step.automatability === Automatability.MANUAL ? "outline" : "default"
        }
      >
        {isProcessing ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : step.automatability !== Automatability.MANUAL ? (
          <Zap className="mr-1.5 h-4 w-4" />
        ) : (
          <UserCheck className="mr-1.5 h-4 w-4" />
        )}
        {isProcessing
          ? "Processing..."
          : step.automatability !== Automatability.MANUAL
            ? step.status === StepStatus.FAILED
              ? "Retry"
              : "Execute"
            : "Mark as Complete"}
      </Button>
      {step.automatability !== Automatability.MANUAL &&
        step.status !== StepStatus.FAILED && (
        <Button
          variant="link"
          size="sm"
          className="px-2 text-xs text-muted-foreground hover:text-primary"
          onClick={onRequestAdmin}
        >
          Request from Admin
        </Button>
      )}
    </>
  );
}

export function ConfigureLink({ url }: { url: string }) {
  return (
    <Button
      variant="link"
      size="sm"
      asChild
      className="ml-auto p-0 text-xs text-muted-foreground hover:text-primary"
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-1 h-3 w-3" /> Configure
      </a>
    </Button>
  );
}
