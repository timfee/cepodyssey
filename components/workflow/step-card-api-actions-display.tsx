"use client";

import { cn } from "@/lib/utils";
import { getMethodColor } from "./config";

interface DisplayApiAction {
  method: string;
  path: string;
  isManual: boolean;
}

interface StepCardApiActionsDisplayProps {
  actions: DisplayApiAction[];
}

export function StepCardApiActionsDisplay({
  actions,
}: StepCardApiActionsDisplayProps) {
  if (!actions || actions.length === 0) return null;

  const apiActions = actions.filter(
    (action) => !action.isManual || (action.isManual && action.path),
  );

  if (apiActions.length === 0) return null;

  return (
    <ul className="space-y-1 text-sm">
      {apiActions.map((action, index) => (
        <li key={index} className="flex gap-2 items-baseline">
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              getMethodColor(action.method),
            )}
          >
            {action.method || (action.isManual ? "MANUAL" : "ACTION")}
          </span>
          <code className="font-mono text-xs break-all text-muted-foreground">
            {action.path}
          </code>
        </li>
      ))}
    </ul>
  );
}
