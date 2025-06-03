"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  InfoIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";

import { useAppSelector } from "@/hooks/use-redux";
import type { ManagedStep } from "@/lib/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StepItemProps {
  step: ManagedStep;
  onExecuteStep: (stepId: string) => void;
  isLast: boolean;
}

export function StepItem({ step, onExecuteStep, isLast }: StepItemProps) {
  const allStepsStatus = useAppSelector((state) => state.setupSteps.steps);

  const prerequisitesMet =
    step.requires?.every(
      (reqId) => allStepsStatus[reqId]?.status === "completed"
    ) ?? true;

  const isRunnable = step.automatable && prerequisitesMet;
  const allowRetry = step.status === "failed";
  const isButtonDisabled =
    step.status === "in_progress" ||
    (step.status === "completed" && !step.metadata?.preExisting);

  const getStatusIcon = () => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2Icon className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Loader2Icon className="h-5 w-5 animate-spin text-blue-500" />;
      case "failed":
        return <AlertCircleIcon className="h-5 w-5 text-destructive" />;
      default:
        return <CircleIcon className="h-5 w-5 text-muted-foreground/60" />;
    }
  };

  return (
    <li className="mb-10 ml-6">
      <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background ring-8 ring-background">
        {getStatusIcon()}
      </span>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{step.title}</h4>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {step.metadata?.resourceUrl && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={step.metadata.resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Resource</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {step.automatable && (
            <Button
              size="sm"
              onClick={() => onExecuteStep(step.id)}
              disabled={!isRunnable || isButtonDisabled}
              variant={allowRetry ? "secondary" : "default"}
            >
              {allowRetry ? (
                <RotateCcwIcon className="mr-2 h-4 w-4" />
              ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
              )}
              {allowRetry ? "Retry" : "Run"}
            </Button>
          )}
        </div>
      </div>
      {step.metadata?.preExisting && (
        <Badge variant="outline" className="mt-2 flex w-fit items-center gap-1">
          <InfoIcon className="h-3 w-3" />
          Pre-existing configuration found
        </Badge>
      )}
      {step.status === "failed" && step.error && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{step.error}</AlertDescription>
        </Alert>
      )}
    </li>
  );
}
