"use client";

import { cn } from "@/lib/utils";
import { formatValue } from "./utils";
import type { StepInput } from "@/lib/types";

interface DisplayInput extends StepInput {
  currentValue: unknown;
}

interface StepCardInputsDisplayProps {
  inputs: DisplayInput[];
}

export function StepCardInputsDisplay({ inputs }: StepCardInputsDisplayProps) {
  if (!inputs || inputs.length === 0) return null;

  return (
    <div className="grid text-sm border border-border rounded bg-card dark:bg-black/20">
      <div className="grid grid-cols-3 bg-muted/50 dark:bg-white/5 text-muted-foreground font-medium px-2 py-1.5">
        <div>Variable</div>
        <div>Value</div>
        <div>From Step</div>
      </div>
      {inputs.map((input, index) => (
        <div
          key={index}
          className="grid grid-cols-3 items-start gap-x-2 px-2 py-1.5 border-t border-border"
        >
          <code className="font-mono text-xs break-all">{input.data.key}</code>
          <code
            className={cn(
              "font-mono text-xs rounded px-1 py-0.5 break-all",
              input.currentValue != null
                ? "bg-slate-100 dark:bg-slate-700"
                : "bg-muted/30 dark:bg-slate-800 italic",
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
            className="text-xs text-muted-foreground truncate"
            title={input.stepTitle}
          >
            {input.stepTitle || "N/A"}
          </span>
        </div>
      ))}
    </div>
  );
}
