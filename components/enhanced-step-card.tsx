"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2Icon,
  CircleIcon,
  AlertCircleIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  ChevronDownIcon,
  KeyIcon,
  LinkIcon,
  InfoIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from "lucide-react";
import type { ManagedStep } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { allStepDefinitions } from "@/lib/steps";
import { useState } from "react";

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
  const [isExpanded, setIsExpanded] = useState(false);

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (step.status) {
      case "completed":
        return {
          icon: <CheckCircle2Icon className="h-5 w-5" />,
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-200 dark:border-green-800",
        };
      case "in_progress":
        return {
          icon: <Loader2Icon className="h-5 w-5 animate-spin" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          borderColor: "border-blue-200 dark:border-blue-800",
        };
      case "failed":
        return {
          icon: <AlertCircleIcon className="h-5 w-5" />,
          color: "text-red-600",
          bgColor: "bg-red-50 dark:bg-red-950/30",
          borderColor: "border-red-200 dark:border-red-800",
        };
      default:
        return {
          icon: <CircleIcon className="h-5 w-5" />,
          color: "text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
          borderColor: "border-gray-200 dark:border-gray-800",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  // Get required inputs from dependencies
  const requiredInputs =
    step.requires?.flatMap((reqStepId) => {
      return Object.entries(OUTPUT_KEYS)
        .filter(([_, value]) => {
          const stepPrefix = reqStepId.toLowerCase().replace("-", "");
          return value.toLowerCase().startsWith(stepPrefix);
        })
        .map(([key, outputKey]) => ({
          key,
          outputKey,
          fromStep:
            allStepDefinitions.find((s) => s.id === reqStepId)?.title ||
            reqStepId,
          value: outputs[outputKey],
          available: outputs[outputKey] !== undefined,
        }));
    }) || [];

  // Get outputs this step produces
  const producedOutputs = Object.entries(OUTPUT_KEYS)
    .filter(([_, value]) => {
      const stepPrefix = step.id.toLowerCase().replace("-", "");
      return value.toLowerCase().startsWith(stepPrefix);
    })
    .map(([key, outputKey]) => ({
      key,
      outputKey,
      value: outputs[outputKey],
      available: outputs[outputKey] !== undefined,
    }));

  const canExecute =
    canRunGlobal &&
    (!step.requires ||
      step.requires.every((reqId) => {
        const reqStep = allStepDefinitions.find((s) => s.id === reqId);
        return (
          reqStep &&
          outputs[
            Object.values(OUTPUT_KEYS).find((v) =>
              v.toLowerCase().startsWith(reqId.toLowerCase().replace("-", "")),
            ) || ""
          ]
        );
      }));

  return (
    <Card className={`${statusDisplay.borderColor} border-2`}>
      <CardHeader className={`${statusDisplay.bgColor} pb-4`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <div className={statusDisplay.color}>{statusDisplay.icon}</div>
            <div className="flex-1">
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription className="mt-1">
                {step.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={step.automatable ? "default" : "secondary"}>
              {step.automatable ? "Automated" : "Manual"}
            </Badge>
            <Badge variant="outline">{step.id}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {step.automatable && step.status !== "completed" && (
            <Button
              size="sm"
              onClick={() => onExecute(step.id)}
              disabled={!canExecute || step.status === "in_progress"}
              variant={step.status === "failed" ? "destructive" : "default"}
            >
              {step.status === "in_progress" ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : step.status === "failed" ? (
                <RotateCcwIcon className="mr-2 h-4 w-4" />
              ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
              )}
              {step.status === "in_progress"
                ? "Running..."
                : step.status === "failed"
                  ? "Retry"
                  : "Execute"}
            </Button>
          )}

          {!step.automatable && step.status !== "completed" && (
            <Button size="sm" variant="outline">
              <KeyIcon className="mr-2 h-4 w-4" />
              Mark Complete
            </Button>
          )}

          {step.metadata?.resourceUrl && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={step.metadata.resourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                View Resource
              </a>
            </Button>
          )}

          {step.adminUrls?.configure && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={
                  typeof step.adminUrls.configure === "function"
                    ? step.adminUrls.configure(outputs) || "#"
                    : step.adminUrls.configure
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Configure
              </a>
            </Button>
          )}
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                View Details
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            {/* Required Inputs */}
            {requiredInputs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Required Inputs
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>From Step</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requiredInputs.map((input, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {input.key}
                        </TableCell>
                        <TableCell className="text-sm">
                          {input.fromStep}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-xs">
                          {input.available ? (
                            <code className="text-xs">
                              {String(input.value)}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">
                              Not available
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              input.available ? "default" : "destructive"
                            }
                            className="text-xs"
                          >
                            {input.available ? "Available" : "Missing"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <Separator />

            {/* Produced Outputs */}
            {producedOutputs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ArrowRightIcon className="h-4 w-4" />
                  Produced Outputs
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {producedOutputs.map((output, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs">
                          {output.key}
                        </TableCell>
                        <TableCell className="text-sm truncate max-w-xs">
                          {output.available ? (
                            <code className="text-xs">
                              {String(output.value)}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">
                              Not yet generated
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={output.available ? "default" : "outline"}
                            className="text-xs"
                          >
                            {output.available ? "Generated" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Error Details */}
            {step.error && (
              <>
                <Separator />
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                    Error Details
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {step.error}
                  </p>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
