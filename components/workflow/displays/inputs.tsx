"use client";

import { cn } from "@/lib/utils";
import { formatValue } from "../utils";
import type { DisplayInput } from "../workflow-types";

interface StepCardInputsDisplayProps {
  inputs: DisplayInput[];
}

export function StepCardInputsDisplay({ inputs }: StepCardInputsDisplayProps) {
  if (!inputs || inputs.length === 0) return null;

  return (
    <div className="grid rounded border border-border bg-card text-sm">
      <div className="grid grid-cols-3 bg-muted/50 px-2 py-1.5 font-medium text-muted-foreground">
        <div>Variable</div>
        <div>Value</div>
        <div>From Step</div>
      </div>
      {inputs.map((input, index) => (
        <div
          key={index}
          className="grid grid-cols-3 items-start gap-x-2 border-t border-border px-2 py-1.5"
        >
          <code className="break-all font-mono text-xs">{input.key}</code>
          <code
            className={cn(
              "break-all rounded px-1 py-0.5 font-mono text-xs",
              input.currentValue != null
                ? "bg-slate-100 dark:bg-slate-700"
                : "italic bg-muted/30 dark:bg-slate-600",
            )}
            title={
              typeof input.currentValue === "string"
                ? input.currentValue
                : undefined
            }
          >
            {formatValue(input.currentValue) || "(Not collected yet)"}
          </code>
          <span
            className="truncate text-xs text-muted-foreground"
            title={input.sourceStepTitle}
          >
            {input.sourceStepTitle || "N/A"}
          </span>
        </div>
      ))}
    </div>
  );
}
