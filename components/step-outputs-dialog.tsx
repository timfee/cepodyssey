"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2Icon, XCircleIcon, AlertCircleIcon } from "lucide-react";
import { OUTPUT_KEYS } from "@/lib/types";
import { allStepDefinitions } from "@/lib/steps";
import { useAppSelector, useAppDispatch } from "@/hooks/use-redux";
import { selectStepOutputsModal, closeStepOutputsModal } from "@/lib/redux/slices/modals";

export function StepOutputsDialog() {
  const dispatch = useAppDispatch();
  const { isOpen, step, outputs } = useAppSelector(selectStepOutputsModal);

  if (!step) return null;

  const handleClose = () => {
    dispatch(closeStepOutputsModal());
  };

  // Get the outputs this step produces
  const producedOutputs = Object.entries(OUTPUT_KEYS).filter(([_key, value]) => {
    const stepPrefix = step.id.toLowerCase().replace("-", "");
    return value.toLowerCase().startsWith(stepPrefix);
  });

  // Get the outputs this step requires from other steps
  const requiredOutputs: Array<{
    key: string;
    value: string;
    fromStep: string;
    available: boolean;
  }> = [];

  if (step.requires) {
    step.requires.forEach((reqStepId) => {
      const reqStep = allStepDefinitions.find((s) => s.id === reqStepId);
      if (reqStep) {
        Object.entries(OUTPUT_KEYS).forEach(([key, value]) => {
          const stepPrefix = reqStepId.toLowerCase().replace("-", "");
          if (value.toLowerCase().startsWith(stepPrefix)) {
            requiredOutputs.push({
              key,
              value,
              fromStep: reqStep.title,
              available: !!outputs[value],
            });
          }
        });
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step.title} - Outputs &amp; Dependencies</DialogTitle>
          <DialogDescription>
            View the outputs this step produces and the outputs it requires from other steps.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Outputs Produced */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2Icon className="h-4 w-4 text-green-600" />
              Outputs Produced
            </h3>
            {producedOutputs.length > 0 ? (
              <div className="space-y-2">
                {producedOutputs.map(([key, outputKey]) => {
                  const value = outputs[outputKey];
                  const hasValue = value !== undefined && value !== null;

                  return (
                    <Card key={key} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-muted-foreground">
                              {key}
                            </code>
                            {hasValue && (
                              <Badge variant="outline" className="text-xs">
                                Available
                              </Badge>
                            )}
                          </div>
                          {hasValue && (
                            <div className="mt-1 text-sm break-all">
                              {typeof value === "string" ? (
                                <span className="font-mono">{value}</span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {JSON.stringify(value)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This step does not produce any tracked outputs.
              </p>
            )}
          </div>

          {/* Required Outputs */}
          {requiredOutputs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircleIcon className="h-4 w-4 text-blue-600" />
                Required Outputs (Dependencies)
              </h3>
              <div className="space-y-2">
                {requiredOutputs.map((req, idx) => (
                  <Card key={idx} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-muted-foreground">
                            {req.key}
                          </code>
                          <Badge
                            variant={req.available ? "outline" : "destructive"}
                            className="text-xs"
                          >
                            {req.available ? "Available" : "Missing"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {req.fromStep}
                        </p>
                        {req.available && outputs[req.value] !== undefined && (
                          <div className="mt-1 text-sm break-all">
                            <span className="font-mono">
                              {typeof outputs[req.value] === "string"
                                ? (outputs[req.value] as string)
                                : JSON.stringify(outputs[req.value])}
                            </span>
                          </div>
                        )}
                      </div>
                      {req.available ? (
                        <CheckCircle2Icon className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
