"use client";

import { cn } from "@/lib/utils";
import { formatValue } from "./utils";
import type { StepOutput } from "@/lib/types";

interface DisplayOutput extends StepOutput {
  currentValue: unknown;
}

interface StepCardOutputsDisplayProps {
  outputs: DisplayOutput[];
}

export function StepCardOutputsDisplay({ outputs }: StepCardOutputsDisplayProps) {
  if (!outputs || outputs.length === 0) return null;

  return (
    <div className="grid text-sm border border-border rounded bg-card dark:bg-black/20">
      <div className="grid grid-cols-2 bg-muted/50 dark:bg-white/5 text-muted-foreground font-medium px-2 py-1.5">
        <div>Variable</div>
        <div>Value</div>
      </div>
      {outputs.map((output, index) => (
        <div
          key={index}
          className="grid grid-cols-2 items-start gap-x-2 px-2 py-1.5 border-t border-border"
        >
          <code className="font-mono text-xs break-all">{output.key}</code>
          <code
            className={cn(
              "font-mono text-xs rounded px-1 py-0.5 break-all",
              output.currentValue != null
                ? "bg-slate-100 dark:bg-slate-700"
                : "bg-muted/30 dark:bg-slate-800 italic",
            )}
            title={
              typeof output.currentValue === "string"
                ? output.currentValue
                : undefined
            }
          >
            {formatValue(output.currentValue) || "<will be generated>"}
          </code>
        </div>
      ))}
    </div>
  );
}
