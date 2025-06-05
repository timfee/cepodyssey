"use client";

import { useMemo, useState } from "react";
import { Card, CardFooter } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  UserCheck,
  Lock,
  AlertTriangle,
  Zap,
  Eye,
  ClipboardEdit,
  ExternalLink,
  RefreshCw,
  Loader2,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManagedStep } from "@/lib/types";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import type { StepId } from "@/lib/steps/step-refs";
import { useAppDispatch } from "@/hooks/use-redux";
import { markStepComplete, markStepIncomplete } from "@/lib/redux/slices/setup-steps";

interface StepCardProps {
  step: ManagedStep;
  outputs: Record<string, unknown>;
  onExecute: (stepId: StepId) => void;
  canRunGlobal: boolean;
}

const stateConfig: Record<
  string,
  { icon: LucideIcon; colorClass: string; label: string; tooltip: string }
> = {
  "completed-verified": {
    icon: CheckCircle2,
    colorClass: "text-success",
    label: "Completed",
    tooltip: "Completed and verified by the system.",
  },
  "completed-user": {
    icon: UserCheck,
    colorClass: "text-sky-500",
    label: "Marked as Done",
    tooltip: "You've marked this step as completed.",
  },
  pending: {
    icon: Info,
    colorClass: "text-muted-foreground",
    label: "Pending",
    tooltip: "This step has not been started yet.",
  },
  in_progress: {
    icon: Loader2,
    colorClass: "text-blue-500",
    label: "In Progress",
    tooltip: "This step is currently being executed.",
  },
  failed: {
    icon: AlertTriangle,
    colorClass: "text-destructive",
    label: "Failed",
    tooltip: "This step encountered an error.",
  },
  available: {
    icon: Info,
    colorClass: "text-primary",
    label: "Available",
    tooltip: "This step is ready to be actioned.",
  },
  blocked: {
    icon: Lock,
    colorClass: "text-muted-foreground",
    label: "Blocked",
    tooltip: "Prerequisites must be completed first.",
  },
};

const automatabilityConfig: Record<
  string,
  {
    icon: LucideIcon;
    baseColorClass?: string;
    badgeClasses?: string;
    label: string;
    tooltip: string;
  }
> = {
  automated: {
    icon: Zap,
    baseColorClass: "text-primary",
    label: "Automated",
    tooltip: "This step can be fully automated by the system.",
  },
  supervised: {
    icon: Eye,
    badgeClasses:
      "bg-warning/20 text-warning-foreground px-1.5 py-0.5 rounded-sm",
    baseColorClass: "text-warning-foreground",
    label: "Supervised",
    tooltip: "This step requires your review before or during execution.",
  },
  manual: {
    icon: ClipboardEdit,
    baseColorClass: "text-muted-foreground",
    label: "Manual",
    tooltip:
      "This step requires manual action from you, possibly in another system.",
  },
};

const getProviderColorClass = (provider: string): string => {
  switch (provider) {
    case "Google":
      return "text-blue-600 font-medium";
    case "Microsoft":
      return "text-teal-600 font-medium";
    default:
      return "text-muted-foreground/90 font-medium";
  }
};

const renderMonospace = (text: string | undefined) =>
  text ? (
    <code className="font-mono text-xs bg-slate-100 p-0.5 rounded">{text}</code>
  ) : null;

export function StepCard({
  step,
  outputs,
  onExecute,
  canRunGlobal,
}: StepCardProps) {
  const dispatch = useAppDispatch();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const isUserCompleted =
    step.status === "completed" && step.completionType === "user-marked";

  const statusKey = isUserCompleted
    ? "completed-user"
    : step.status === "completed"
      ? "completed-verified"
      : step.status;
  const statusInfo = stateConfig[statusKey];
  const autoInfo = automatabilityConfig[step.automatability ?? "manual"];
  const StatusIcon = statusInfo.icon;
  const AutoIcon = autoInfo.icon;


  const requiredInputs = useMemo(
    () => getStepInputs(step.id as StepId),
    [step.id],
  );
  const producedOutputs = useMemo(
    () => getStepOutputs(step.id as StepId),
    [step.id],
  );

  const canExecutePrimary = !(
    step.status === "in_progress" || step.status === "completed" || !canRunGlobal
  );

  const isCompleted = step.status === "completed";
  const isBlocked = step.status === "blocked";
  const isProcessing = step.status === "in_progress";

  return (
    <TooltipProvider delayDuration={100}>
      <Card
        className={cn(
          "w-full transition-all duration-200 ease-in-out",
          "shadow-google-card border",
          isBlocked || isProcessing
            ? "opacity-70 border-border"
            : "hover:shadow-google-card-hover hover:border-primary/50",
        )}
      >
        <Accordion type="single" collapsible className="w-full" disabled={isProcessing}>
          <AccordionItem value={`step-${step.id}`} className="border-b-0">
            <AccordionTrigger
              className={cn(
                "p-4 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-[state=open]:pb-2 group rounded-t-md",
                canExecutePrimary && isHeaderHovered && "bg-primary/5",
              )}
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
            >
              <div className="flex flex-col w-full text-left">
                <div className="flex items-start justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <StatusIcon
                          className={cn(
                            "h-6 w-6 shrink-0",
                            statusInfo.colorClass,
                            isProcessing && "animate-spin",
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{statusInfo.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                    <h3 className="font-semibold text-lg text-foreground">{step.title}</h3>
                  </div>
                  <div className="text-xs ml-2 shrink-0 pt-1">
                    <span className={getProviderColorClass(step.provider)}>{step.provider}</span>
                    <span className="text-muted-foreground/80"> / {step.activity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-xs pl-9">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "flex items-center gap-1 cursor-default",
                          autoInfo.badgeClasses ? autoInfo.badgeClasses : autoInfo.baseColorClass,
                        )}
                      >
                        <AutoIcon
                          className={cn(
                            "h-3.5 w-3.5",
                            autoInfo.badgeClasses ? "text-warning-foreground" : autoInfo.baseColorClass,
                          )}
                        />
                        <span className="font-medium border-b border-dashed border-muted-foreground/70 pb-px">
                          {autoInfo.label}
                        </span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{autoInfo.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>

                  <span className="mx-1 text-muted-foreground/50">|</span>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "font-medium border-b border-dashed border-muted-foreground/70 pb-px",
                          statusInfo.colorClass,
                        )}
                      >
                        {statusInfo.label}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{statusInfo.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>

                  {isProcessing && <span className="text-primary ml-1">(Processing...)</span>}
                </div>

                <p className="text-sm text-muted-foreground mt-2 pl-9 group-data-[state=closed]:truncate group-data-[state=closed]:max-w-[90%]">
                  {step.description}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pt-0 pb-4 bg-card">
              <div className="pl-9 space-y-4 pt-2">
                <div>
                  <h4 className="font-medium text-sm mb-1 text-foreground/90">Technical Details</h4>
                  <p className="text-sm text-muted-foreground">{step.details}</p>
                </div>
                {requiredInputs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-foreground/90">Inputs</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {requiredInputs.map((input, index) => (
                        <li key={index}>{input.data.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {producedOutputs.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-foreground/90">Outputs</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {producedOutputs.map((output, index) => (
                        <li key={index}>{output.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {step.actions && step.actions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-foreground/90">Automated Actions</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {step.actions.map((action, index) => (
                        <li key={index}>{renderMonospace(action)}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {step.nextStep && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-foreground/90">Next Step</h4>
                    <p className="text-sm text-muted-foreground">{step.nextStep.description}</p>
                  </div>
                )}
                {step.error && (
                  <div>
                    <h4 className="font-medium text-sm mb-1 text-destructive">Error Details</h4>
                    <p className="text-sm text-destructive/90">{step.error}</p>
                  </div>
                )}
                {isCompleted && step.metadata?.resourceUrl && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={isProcessing}
                      className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-primary"
                    >
                      <a
                        href={step.metadata.resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Resource <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <CardFooter
          className={cn(
            "p-4 border-t flex flex-wrap gap-2 items-center",
            isBlocked ? "bg-slate-50" : "bg-card",
          )}
        >
          {isBlocked ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mr-2 shrink-0" />
              <span>Complete prerequisite steps first.</span>
            </div>
          ) : isCompleted ? (
            <>
              <span className={cn("font-medium text-sm", statusInfo.colorClass)}>
                Status: {statusInfo.label}
              </span>
              <div className="flex-grow"></div>
              {step.automatability !== "manual" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExecute(step.id as StepId)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Re-run
                </Button>
              )}
              {step.automatability === "manual" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(markStepIncomplete(step.id))}
                  disabled={isProcessing}
                >
                  Mark as Incomplete
                </Button>
              )}
            </>
          ) : (
            <>
              {step.automatability !== "manual" ? (
                <Button
                  onClick={() => onExecute(step.id as StepId)}
                  disabled={!canExecutePrimary}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Execute
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dispatch(markStepComplete({ id: step.id, isUserMarked: true }))}
                  disabled={isProcessing}
                >
                  Mark as Complete
                </Button>
              )}
            </>
          )}
          {step.adminUrls?.configure && (
            <Button variant="link" size="sm" asChild className="text-xs p-0">
              <a
                href={
                  typeof step.adminUrls.configure === "function"
                    ? step.adminUrls.configure(outputs) || "#"
                    : step.adminUrls.configure
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Configure
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
