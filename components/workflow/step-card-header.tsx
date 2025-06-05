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
} from "./config";
import { getProviderColorClass } from "./config";

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
      <div className="flex flex-col w-full text-left">
        {/* Header: Icon, Title, Provider */}
        <div className="flex items-start justify-between w-full">
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
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
            <span className="text-xs text-muted-foreground pt-1">{stepId}</span>
          </div>
          <div className="text-xs ml-2 shrink-0 pt-1">
            <span className={getProviderColorClass(provider)}>{provider}</span>
            <span className="text-muted-foreground/80"> / {activity}</span>
          </div>
        </div>

        {/* Sub-header: Tags and Status Label */}
        <div className="flex items-center gap-2 mt-1.5 text-xs pl-8">
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "flex items-center gap-1 cursor-default",
                  automatabilityDisplay.badgeClasses ||
                    automatabilityDisplay.baseColorClass,
                )}
              >
                <AutoIcon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    automatabilityDisplay.badgeClasses
                      ? ""
                      : automatabilityDisplay.baseColorClass,
                  )}
                />
                <span className="font-medium border-b border-dashed border-muted-foreground/70 pb-px">
                  {automatabilityDisplay.label}
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{automatabilityDisplay.tooltip}</p>
            </TooltipContent>
          </Tooltip>
          <span className="mx-1 text-muted-foreground/50">|</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "font-medium border-b border-dashed border-muted-foreground/70 pb-px",
                  statusDisplay.colorClass.replace("animate-spin", "").trim(),
                )}
              >
                {statusDisplay.label}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusDisplay.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mt-2 pl-8 group-data-[state=closed]:truncate group-data-[state=closed]:max-w-[90%]">
          {description}
        </p>
      </div>
    </TooltipProvider>
  );
}
