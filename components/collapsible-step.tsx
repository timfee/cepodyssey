"use client";

import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import type { ManagedStep } from "@/lib/types";
import { StepItem } from "./step";

interface CollapsibleStepProps {
  step: ManagedStep;
  isLastStep: boolean;
  onExecuteStepAction: (stepId: string) => void;
  canRunGlobal: boolean;
}

export function CollapsibleStep({
  step,
  isLastStep,
  onExecuteStepAction,
  canRunGlobal,
}: CollapsibleStepProps) {
  const [isExpanded, setIsExpanded] = useState(
    step.status === "in_progress" || step.status === "failed",
  );

  const getStatusColor = () => {
    switch (step.status) {
      case "completed":
        return "text-green-600 bg-green-50 dark:bg-green-950/30";
      case "in_progress":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
      case "failed":
        return "text-red-600 bg-red-50 dark:bg-red-950/30";
      default:
        return "text-gray-600 bg-gray-50 dark:bg-gray-950/30";
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case "completed":
        return "✓";
      case "in_progress":
        return "⋯";
      case "failed":
        return "✗";
      default:
        return "○";
    }
  };

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-lg transition-all",
          "hover:bg-gray-50 dark:hover:bg-gray-800",
          getStatusColor(),
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono">{getStatusIcon()}</span>
          <span className="font-medium text-sm">{step.title}</span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 ml-4">
          <StepItem
            step={step}
            isLastStep={isLastStep}
            onExecuteStepAction={onExecuteStepAction}
            canRunGlobal={canRunGlobal}
          />
        </div>
      )}
    </div>
  );
}
