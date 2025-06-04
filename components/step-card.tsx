"use client";

import { useMemo } from "react";
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
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";
import { useStepCompletion } from "@/hooks/use-step-completion";
import { useAppDispatch } from "@/hooks/use-redux";
import { updateStep } from "@/lib/redux/slices/setup-steps";

interface StepCardProps {
  step: ManagedStep;
  outputs: Record<string, unknown>;
  onExecute: (stepId: string) => void;
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

export function StepCard({
  step,
  outputs,
  onExecute,
  canRunGlobal,
}: StepCardProps) {
  const dispatch = useAppDispatch();
  const [userDone, setUserDone] = useStepCompletion(
    step.id,
    step.completionType === "user-marked",
  );

  const statusKey =
    step.status === "completed" && step.completionType === "user-marked"
      ? "completed-user"
      : step.status === "completed"
        ? "completed-verified"
        : step.status;
  const statusInfo = stateConfig[statusKey];
  const autoInfo = automatabilityConfig[step.automatability ?? "manual"];
  const StatusIcon = statusInfo.icon;
  const AutoIcon = autoInfo.icon;

  const canExecute = useMemo(() => {
    if (!canRunGlobal) return false;
    if (step.status === "in_progress" || step.status === "completed")
      return false;
    return true;
  }, [canRunGlobal, step.status]);

  const requiredInputs = useMemo(() => getStepInputs(step.id), [step.id]);
  const producedOutputs = useMemo(() => getStepOutputs(step.id), [step.id]);

  return (
    <Card className="shadow-google-card hover:shadow-google-card-hover transition-all">
      <div className="flex items-start p-4 gap-4">
        <div className={cn("flex-shrink-0", statusInfo.colorClass)}>
          {StatusIcon && <StatusIcon className="h-5 w-5" />}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{step.title}</h3>
            <span className="text-xs text-muted-foreground">{step.id}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-1">
                    <AutoIcon
                      className={cn(
                        "h-4 w-4",
                        autoInfo.baseColorClass ?? "text-muted-foreground",
                      )}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{autoInfo.label}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>
        <div className="flex gap-2">
          {step.status === "failed" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onExecute(step.id)}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Retry
            </Button>
          )}
          {step.status !== "completed" && step.automatability !== "manual" && (
            <Button
              size="sm"
              onClick={() => onExecute(step.id)}
              disabled={!canExecute}
            >
              {step.status === "in_progress" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {step.status === "in_progress" ? "Working" : "Execute"}
            </Button>
          )}
          {step.automatability === "manual" && (
            <Button
              size="sm"
              variant={userDone ? "secondary" : "outline"}
              onClick={() => {
                const newVal = !userDone;
                setUserDone(newVal);
                dispatch(
                  updateStep({
                    id: step.id,
                    status: newVal ? "completed" : "pending",
                    completionType: newVal ? "user-marked" : undefined,
                  }),
                );
              }}
            >
              {userDone ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <ClipboardEdit className="h-4 w-4 mr-1" />
              )}
              {userDone ? "Mark Undone" : "Mark Done"}
            </Button>
          )}
        </div>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="details">
          <AccordionTrigger className="px-4">Details</AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
            {step.details}
          </AccordionContent>
        </AccordionItem>
        {requiredInputs.length > 0 && (
          <AccordionItem value="inputs">
            <AccordionTrigger className="px-4">
              Required Inputs
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="text-sm list-disc pl-5 space-y-1">
                {requiredInputs.map((inp) => (
                  <li key={inp.data.key || inp.data.stepId}>
                    {inp.data.description}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {producedOutputs.length > 0 && (
          <AccordionItem value="outputs">
            <AccordionTrigger className="px-4">Outputs</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="text-sm list-disc pl-5 space-y-1">
                {producedOutputs.map((out) => (
                  <li key={out.key}>{out.description}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
      {step.adminUrls?.configure && (
        <CardFooter className="px-4 py-2">
          <Button variant="link" asChild className="text-xs p-0">
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
        </CardFooter>
      )}
    </Card>
  );
}
