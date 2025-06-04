"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CircleIcon,
  CheckIcon,
  KeyIcon,
  ExternalLinkIcon,
  InfoIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
} from "lucide-react";
import React from "react";
import { useSession } from "next-auth/react";

import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { updateStep } from "@/lib/redux/slices/setup-steps";
import type { ManagedStep, StepStatusInfo } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { allStepDefinitions } from "@/lib/steps";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDialogs } from "./dialog-provider";

interface StepItemProps {
  step: ManagedStep;
  isLastStep: boolean;
  onExecuteStepAction: (stepId: string) => void;
  canRunGlobal: boolean;
}

/**
 * Renders a single automation step card with actions and status.
 */
export function StepItem({
  step,
  isLastStep,
  onExecuteStepAction,
  canRunGlobal,
}: StepItemProps) {
  const dispatch = useAppDispatch();
  const allStepsStatus = useAppSelector((state) => state.setupSteps.steps);
  const outputs = useAppSelector((state) => state.appConfig.outputs);
  const appConfig = useAppSelector((state) => state.appConfig);
  const { data: session } = useSession();
  const { openGoogleTokenModal, openStepOutputsModal } = useDialogs();

  const prerequisitesMet = React.useMemo(() => {
    // If already completed, prerequisites are implicitly met
    if (step.status === "completed") {
      return true;
    }

    // Auth errors override prerequisite logic to allow retrying the step
    if (
      step.metadata?.errorCode === "AUTH_EXPIRED" ||
      step.error?.toLowerCase().includes("authentication expired")
    ) {
      return true;
    }

    return (
      step.requires?.every(
        (reqId) => allStepsStatus[reqId]?.status === "completed",
      ) ?? true
    );
  }, [step.requires, step.status, step.error, step.metadata, allStepsStatus]);

  const getStatusVisuals = () => {
    switch (step.status) {
      case "completed":
        return {
          icon: <CheckCircle2Icon className="h-5 w-5 text-green-500" />,
          badgeVariant: "default" as const,
          textColor: "text-green-700 dark:text-green-400",
        };
      case "in_progress":
        return {
          icon: <Loader2Icon className="h-5 w-5 animate-spin text-blue-500" />,
          badgeVariant: "secondary" as const,
          textColor: "text-blue-700 dark:text-blue-400",
        };
      case "failed":
        return {
          icon: <AlertCircleIcon className="h-5 w-5 text-red-500" />,
          badgeVariant: "destructive" as const,
          textColor: "text-red-700 dark:text-red-400",
        };
      case "pending":
      default:
        return {
          icon: (
            <CircleIcon className="h-5 w-5 text-slate-400 dark:text-slate-600" />
          ),
          badgeVariant: "outline" as const,
          textColor: "text-slate-500 dark:text-slate-400",
        };
    }
  };

  const { icon: statusIcon, badgeVariant } = getStatusVisuals();

  const handleMarkAsComplete = () => {
    dispatch(
      updateStep({
        id: step.id,
        status: "completed",
        message: step.message || "Manually marked as completed.",
        metadata: {
          ...step.metadata,
          preExisting: false,
          completedAt: new Date().toISOString(),
        },
      }),
    );
  };

  const isStepEffectivelyDisabled =
    !canRunGlobal ||
    (!prerequisitesMet &&
      step.status !== ("completed" as StepStatusInfo["status"]) &&
      step.metadata?.errorCode !== "AUTH_EXPIRED");

  const runButtonDisabledReason = !canRunGlobal
    ? "Global prerequisites (auth/config) not met."
    : !prerequisitesMet &&
        step.status !== ("completed" as StepStatusInfo["status"]) &&
        step.metadata?.errorCode !== "AUTH_EXPIRED"
      ? "Prerequisite steps not completed."
      : undefined;

  const allowRetryForAutomated =
    step.automatable &&
    (step.status === "failed" ||
      (step.status === "completed" && step.metadata?.preExisting === true) ||
      step.metadata?.errorCode === "AUTH_EXPIRED");

  const stepHasOutputs = () => {
    const stepPrefix = step.id.toLowerCase().replace("-", "");
    return Object.values(OUTPUT_KEYS).some((value) =>
      value.toLowerCase().startsWith(stepPrefix),
    );
  };

  const getMissingPrerequisites = () => {
    if (!step.requires || prerequisitesMet) return [];

    return step.requires
      .filter((reqId) => allStepsStatus[reqId]?.status !== "completed")
      .map((reqId) => {
        const reqStep = allStepDefinitions.find((s) => s.id === reqId);
        return {
          id: reqId,
          title: reqStep?.title || reqId,
          status: allStepsStatus[reqId]?.status || "pending",
        };
      });
  };

  return (
    <li className="flex gap-x-3">
      <div
        className={`relative last:after:hidden after:absolute after:top-7 after:bottom-0 after:w-px ${
          isLastStep ? "" : "after:bg-slate-200 dark:after:bg-slate-700"
        }`}
      >
        <div
          className={`relative flex h-6 w-6 items-center justify-center rounded-full bg-card dark:bg-slate-800 ring-1 ring-slate-300 dark:ring-slate-600`}
        >
          {statusIcon}
        </div>
      </div>

      <Card className="flex-grow shadow-sm hover:shadow-md transition-shadow duration-200 border-0">
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-md font-semibold leading-snug">
              {step.title}
            </CardTitle>
            <Badge
              variant={badgeVariant}
              className="capitalize text-xs h-fit py-0.5 whitespace-nowrap"
            >
              {step.status.replace("_", " ")}
            </Badge>
            {step.status === "completed" && stepHasOutputs() && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2Icon className="h-3 w-3" />
                <span>Outputs available</span>
              </div>
            )}
          </div>
          {step.description && (
            <CardDescription className="text-xs mt-1 leading-relaxed">
              {step.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {!step.automatable && (
            <div className="p-3 border rounded-md bg-blue-50 dark:bg-blue-950/30 space-y-2">
              <h5 className="font-medium text-sm text-blue-900 dark:text-blue-100">
                Manual Action Required
              </h5>

              {/* Special handling for G-S0 */}
              {step.id === "G-S0" && (
                <>
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    Retrieve the provisioning token from Google Admin Console
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => openGoogleTokenModal(handleMarkAsComplete)}
                      variant="default"
                    >
                      <KeyIcon className="mr-1.5 h-3.5 w-3.5" />
                      Enter Token
                    </Button>
                    {step.adminUrls?.configure && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={
                            typeof step.adminUrls.configure === "function"
                              ? (step.adminUrls.configure(outputs) ?? "#")
                              : step.adminUrls.configure
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLinkIcon className="mr-1.5 h-3.5 w-3.5" />
                          Open Google Admin
                        </a>
                      </Button>
                    )}
                  </div>
                  {/* GoogleTokenModal is rendered via DialogProvider */}
                </>
              )}

              {/* Default handling for other manual steps */}
              {step.id !== "G-S0" && (
                <div className="flex items-center gap-2 flex-wrap">
                  {step.adminUrls?.configure && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={
                          typeof step.adminUrls.configure === "function"
                            ? (step.adminUrls.configure(outputs) ?? "#")
                            : step.adminUrls.configure
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="mr-1.5 h-3.5 w-3.5" />
                        Open Console
                      </a>
                    </Button>
                  )}
                  {step.status !== "completed" && (
                    <Button
                      size="sm"
                      onClick={handleMarkAsComplete}
                      variant="secondary"
                    >
                      <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {step.automatable &&
            (step.status === "pending" || allowRetryForAutomated) &&
            step.status !== ("completed" as StepStatusInfo["status"]) && (
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <span tabIndex={isStepEffectivelyDisabled ? 0 : undefined}>
                      <Button
                        size="sm"
                        onClick={() => onExecuteStepAction(step.id)}
                        disabled={
                          isStepEffectivelyDisabled ||
                          step.status === "in_progress" ||
                          (step.status ===
                            ("completed" as StepStatusInfo["status"]) &&
                            !step.metadata?.preExisting)
                        }
                        variant={
                          step.status === "failed" ? "destructive" : "default"
                        }
                        className="w-full sm:w-auto"
                      >
                        {step.status === "in_progress" ? (
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        ) : allowRetryForAutomated &&
                          step.status !== "pending" ? (
                          <RotateCcwIcon className="mr-2 h-4 w-4" />
                        ) : (
                          <PlayIcon className="mr-2 h-4 w-4" />
                        )}
                        {step.status === "in_progress"
                          ? "Running..."
                          : allowRetryForAutomated && step.status !== "pending"
                            ? step.status === "failed"
                              ? "Retry Step"
                              : "Re-run Check"
                            : "Run Step"}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isStepEffectivelyDisabled && runButtonDisabledReason && (
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-medium">{runButtonDisabledReason}</p>
                        {!canRunGlobal && (
                          <div className="text-xs space-y-1">
                            {!appConfig.domain && (
                              <p>• Domain not configured</p>
                            )}
                            {!appConfig.tenantId && (
                              <p>• Tenant ID not configured</p>
                            )}
                            {!session?.hasGoogleAuth && (
                              <p>• Google authentication required</p>
                            )}
                            {!session?.hasMicrosoftAuth && (
                              <p>• Microsoft authentication required</p>
                            )}
                          </div>
                        )}
                        {!prerequisitesMet &&
                          getMissingPrerequisites().length > 0 && (
                            <div className="text-xs space-y-1">
                              <p className="font-medium">
                                Missing prerequisites:
                              </p>
                              {getMissingPrerequisites().map((prereq) => (
                                <p key={prereq.id}>
                                  • {prereq.title} ({prereq.status})
                                </p>
                              ))}
                            </div>
                          )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

          {step.status === "completed" && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {step.metadata?.preExisting && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal border-blue-400 text-blue-700 dark:border-blue-600 dark:text-blue-300"
                >
                  <InfoIcon className="mr-1 h-3 w-3" /> Pre-existing
                </Badge>
              )}
              {step.metadata?.resourceUrl && (
                <Button variant="outline" size="sm" asChild className="gap-1">
                  <a
                    href={step.metadata.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon className="h-3 w-3" /> View in Admin
                    Console
                  </a>
                </Button>
              )}
              {step.message && !step.error && step.automatable && (
                <p className="text-xs text-muted-foreground italic w-full">
                  {step.message}
                </p>
              )}
            </div>
          )}

          {(step.status === "completed" || stepHasOutputs()) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openStepOutputsModal(step, outputs, allStepsStatus)
              }
              className="gap-1"
            >
              <InfoIcon className="h-3 w-3" />
              View Outputs &amp; Dependencies
            </Button>
          )}

          {step.status === "failed" &&
            step.metadata?.errorCode === "AUTH_EXPIRED" && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>
                  Your{" "}
                  {step.metadata.errorProvider === "google"
                    ? "Google Workspace"
                    : "Microsoft"}{" "}
                  session has expired. Please sign in again to continue.
                </AlertDescription>
              </Alert>
            )}

          {step.status === "failed" && step.error && (
            <Alert variant="destructive" className="mt-2 text-xs">
              <AlertCircleIcon className="h-4 w-4" />
              <AlertTitle className="font-medium">Error</AlertTitle>
              <AlertDescription>
                {step.metadata?.errorCode === "API_NOT_ENABLED" ? (
                  <div className="space-y-2">
                    <p>This step requires enabling a Google Cloud API:</p>
                    <div className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded space-y-1">
                      {step.error.split("\n").map((line, i) => {
                        const urlMatch = line.match(
                          /https:\/\/console\.developers\.google\.com[^\s]+/,
                        );
                        if (urlMatch) {
                          const parts = line.split(urlMatch[0]);
                          return (
                            <div key={i}>
                              {parts[0]}
                              <a
                                href={urlMatch[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Enable API
                              </a>
                              {parts[1]}
                            </div>
                          );
                        }
                        return <div key={i}>{line}</div>;
                      })}
                    </div>
                    <p className="text-xs italic">
                      After enabling, wait 2-3 minutes before retrying.
                    </p>
                  </div>
                ) : step.error.includes(
                    "is not enabled for your Google Cloud project",
                  ) ? (
                  <div className="space-y-2">
                    <p>This step requires enabling a Google Cloud API:</p>
                    <div className="text-xs bg-red-50 dark:bg-red-950 p-2 rounded">
                      {step.error.split("\n").map((line, i) => (
                        <div key={i}>
                          {line.includes("Click here to enable") ? (
                            <span>
                              {line.split(": ")[0]}:
                              <a
                                href={line.split(": ")[1]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600 hover:text-blue-800"
                              >
                                Enable API
                              </a>
                            </span>
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  step.error
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </li>
  );
}
