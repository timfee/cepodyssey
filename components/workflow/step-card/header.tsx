"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  AutomatabilityDisplayConfig,
  StatusDisplayConfig,
} from "../config";

interface StepCardHeaderProps {
  stepId: string;
  title: string;
  description: string;
  provider: string;
  activity: string;
  statusDisplay: StatusDisplayConfig;
  automatabilityDisplay: AutomatabilityDisplayConfig;
  isProcessing: boolean;
}

const getProviderColorClass = (provider: string): string => {
  switch (provider?.toLowerCase()) {
    case "google":
      return "text-blue-600 font-medium";
    case "microsoft":
      return "text-teal-600 font-medium";
    default:
      return "text-muted-foreground/90 font-medium";
  }
};

export function StepCardHeader({
  stepId,
  title,
  description,
  provider,
  activity,
  statusDisplay,
  automatabilityDisplay,
  isProcessing,
}: StepCardHeaderProps) {
  const StatusIcon = statusDisplay.icon;
  const AutoIcon = automatabilityDisplay.icon;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex w-full flex-col text-left">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <StatusIcon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    statusDisplay.colorClass,
                    isProcessing && "animate-spin",
                  )}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusDisplay.tooltip}</p>
              </TooltipContent>
            </Tooltip>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <span className="pt-1 text-xs text-muted-foreground">{stepId}</span>
          </div>
          <div className="ml-2 shrink-0 pt-1 text-xs">
            <span className={getProviderColorClass(provider)}>{provider}</span>
            <span className="text-muted-foreground/80"> / {activity}</span>
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-2 pl-8 text-xs">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "flex cursor-default items-center gap-1",
                  automatabilityDisplay.badgeClasses ||
                    automatabilityDisplay.baseColorClass,
                )}
              >
                <AutoIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    automatabilityDisplay.badgeClasses
                      ? "text-inherit"
                      : automatabilityDisplay.baseColorClass,
                  )}
                />
                <span className="border-b border-dashed border-muted-foreground/70 pb-px font-medium">
                  {automatabilityDisplay.label}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{automatabilityDisplay.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <p className="mt-2 pl-8 text-sm text-muted-foreground group-data-[state=closed]:max-w-[90%] group-data-[state=closed]:truncate">
          {description}
        </p>
      </div>
    </TooltipProvider>
  );
}
