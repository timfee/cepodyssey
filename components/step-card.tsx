"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle2Icon,
  CircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  MoreVerticalIcon,
  ExternalLinkIcon,
  InfoIcon,
  KeyIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { ManagedStep } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { allStepDefinitions } from "@/lib/steps";
import { useAppDispatch } from "@/hooks/use-redux";
import {
  openStepDetailsModal,
  openStepOutputsModal,
} from "@/lib/redux/slices/modals";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StepCardProps {
  step: ManagedStep;
  outputs: Record<string, unknown>;
  onExecute: (stepId: string) => void;
  canRunGlobal: boolean;
}

export function StepCard({
  step,
  outputs,
  onExecute,
  canRunGlobal,
}: StepCardProps) {
  const dispatch = useAppDispatch();

  // Get category accent color
  const getCategoryAccent = () => {
    switch (step.category) {
      case "Google":
        return "border-l-4 border-l-blue-500";
      case "Microsoft":
        return "border-l-4 border-l-purple-500";
      case "SSO":
        return "border-l-4 border-l-green-500";
    }
  };

  // Get status display properties
  const getStatusDisplay = () => {
    switch (step.status) {
      case "completed":
        return {
          icon: <CheckCircle2Icon className="h-5 w-5" />,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
        };
      case "in_progress":
        return {
          icon: <Loader2Icon className="h-5 w-5 animate-spin" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
        };
      case "failed":
        return {
          icon: <AlertCircleIcon className="h-5 w-5" />,
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/30",
        };
      default:
        return {
          icon: <CircleIcon className="h-5 w-5" />,
          color: "text-gray-400",
          bgColor: "",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Check if step can be executed
  const prerequisitesMet =
    !step.requires ||
    step.requires.every((reqId) => {
      const reqStep = allStepDefinitions.find((s) => s.id === reqId);
      return (
        reqStep &&
        outputs[
          Object.values(OUTPUT_KEYS).find((v) =>
            v.toLowerCase().startsWith(reqId.toLowerCase().replace("-", ""))
          ) || ""
        ]
      );
    });

  const canExecute =
    canRunGlobal && prerequisitesMet && step.status !== "in_progress";

  // Primary action button logic
  const getPrimaryAction = () => {
    if (!step.automatable && step.status !== "completed") {
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            dispatch(openStepDetailsModal({ step, outputs }));
          }}
        >
          <KeyIcon className="mr-2 h-4 w-4" />
          Manual Step
        </Button>
      );
    }

    if (step.automatable && step.status !== "completed") {
      return (
        <Button
          size="sm"
          onClick={() => onExecute(step.id)}
          disabled={!canExecute}
          variant={step.status === "failed" ? "destructive" : "default"}
        >
          {step.status === "in_progress" ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : step.status === "failed" ? (
            <>
              <RotateCcwIcon className="mr-2 h-4 w-4" />
              Retry
            </>
          ) : (
            <>
              <PlayIcon className="mr-2 h-4 w-4" />
              Execute
            </>
          )}
        </Button>
      );
    }

    if (step.status === "completed") {
      return (
        <Button
          size="sm"
          variant="ghost"
          className="text-green-600"
          disabled
        >
          <CheckCircle2Icon className="mr-2 h-4 w-4" />
          Complete
        </Button>
      );
    }

    return null;
  };

  return (
    <Card className={`${getCategoryAccent()} transition-all hover:shadow-md`}>
      <CardHeader className={`${statusDisplay.bgColor} pb-3`}>
        <div className="space-y-2">
          {/* Header with status and menu */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className={statusDisplay.color}>{statusDisplay.icon}</div>
              <div className="flex-1 space-y-1">
                <CardTitle className="text-base leading-tight">{step.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{step.id}</Badge>
                  {step.metadata?.preExisting && (
                    <Badge variant="secondary" className="text-xs">Pre-existing</Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Dropdown menu for all secondary actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => dispatch(openStepDetailsModal({ step, outputs }))}
                >
                  <InfoIcon className="mr-2 h-4 w-4" />
                  View Instructions
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => dispatch(openStepOutputsModal({ step, outputs, allStepsStatus: {} }))}
                >
                  <ChevronRightIcon className="mr-2 h-4 w-4" />
                  Dependencies & Outputs
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {step.metadata?.resourceUrl && (
                  <DropdownMenuItem asChild>
                    <a href={step.metadata.resourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      View Resource
                    </a>
                  </DropdownMenuItem>
                )}
                {step.adminUrls?.configure && (
                  <DropdownMenuItem asChild>
                    <a 
                      href={typeof step.adminUrls.configure === "function" 
                        ? step.adminUrls.configure(outputs) || "#" 
                        : step.adminUrls.configure}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      Open Console
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Compact description */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {step.description}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-3 pb-3 space-y-3">
        {/* Primary action button */}
        <div className="flex justify-end">
          {getPrimaryAction()}
        </div>

        {/* Error display */}
        {step.status === "failed" && step.error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-xs">
              {step.error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
