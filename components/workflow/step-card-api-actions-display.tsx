"use client";

import { cn } from "@/lib/utils";
import type { DisplayApiAction } from "./workflow-types";

const getMethodColor = (method: string): string => {
  switch (method?.toUpperCase()) {
    case "GET":
      return "text-blue-600";
    case "POST":
      return "text-green-600";
    case "PATCH":
      return "text-orange-600";
    case "PUT":
      return "text-purple-600";
    case "DELETE":
      return "text-red-600";
    default:
      return "text-muted-foreground";
  }
};

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
        <li key={index} className="flex items-baseline gap-2">
          <span
            className={cn(
              "font-mono text-xs font-semibold",
              getMethodColor(action.method),
            )}
          >
            {action.method || (action.isManual ? "MANUAL" : "ACTION")}
          </span>
          <code className="break-all font-mono text-xs text-muted-foreground">
            {action.path}
          </code>
        </li>
      ))}
    </ul>
  );
}
