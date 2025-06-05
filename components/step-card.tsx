"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { useAppDispatch } from "@/hooks/use-redux";
import { openAskAdminModal } from "@/lib/redux/slices/modals";
import {
  markStepComplete,
  markStepIncomplete,
} from "@/lib/redux/slices/setup-steps";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import type { StepId } from "@/lib/steps/step-refs";
import type { ManagedStep, StepInput, StepOutput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getAutomatabilityDisplayConfig,
  getStatusDisplayConfig,
} from "./workflow/config";
import { StepCardApiActionsDisplay } from "./workflow/step-card-api-actions-display";
import { StepCardDetailsSection } from "./workflow/step-card-details-section";
import { StepCardFooterActions } from "./workflow/step-card-footer-actions";
import { StepCardHeader } from "./workflow/step-card-header";
import { StepCardInputsDisplay } from "./workflow/step-card-inputs-display";
import { StepCardOutputsDisplay } from "./workflow/step-card-outputs-display";
import { parseApiAction } from "./workflow/utils";

interface StepCardProps {
  step: ManagedStep;
  outputs: Record<string, unknown>;
  onExecute: (stepId: StepId) => void;
  canRunGlobal: boolean;
}

export function StepCard({
  step,
  outputs,
  onExecute,
  canRunGlobal,
}: StepCardProps) {
  const dispatch = useAppDispatch();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const statusDisplay = useMemo(
    () => getStatusDisplayConfig(step.status, step.completionType),
    [step.status, step.completionType],
  );
  const automatabilityDisplay = useMemo(
    () => getAutomatabilityDisplayConfig(step.automatability),
    [step.automatability],
  );

  const isProcessing = step.status === "in_progress";
  const isCompleted = step.status === "completed";
  const isBlocked = step.status === "blocked";

  const canExecuteStep = useMemo(() => {
    if (!canRunGlobal || isProcessing || isCompleted || isBlocked) return false;
    return true;
  }, [canRunGlobal, isProcessing, isCompleted, isBlocked]);

  const displayInputs = useMemo(() => {
    return getStepInputs(step.id as StepId).map((inputDef) => ({
      ...inputDef,
      currentValue: outputs[inputDef.data.key!],
    }));
  }, [step.id, outputs]);

  const displayOutputs = useMemo(() => {
    return getStepOutputs(step.id as StepId).map((outputDef) => ({
      ...outputDef,
      currentValue: outputs[outputDef.key],
    }));
  }, [step.id, outputs]);

  const displayApiActions = useMemo(() => {
    return (step.actions ?? []).map((action) =>
      parseApiAction(action, outputs),
    );
  }, [step.actions, outputs]);

  const handleExecute = () => onExecute(step.id as StepId);
  const handleMarkComplete = () =>
    dispatch(markStepComplete({ id: step.id, isUserMarked: true }));
  const handleMarkIncomplete = () => dispatch(markStepIncomplete(step.id));
  const handleRequestAdmin = () => dispatch(openAskAdminModal({ step }));

  return (
    <Card
      className={cn(
        "w-full transition-all duration-200 ease-in-out shadow-sm hover:shadow-md",
        isProcessing && "animate-pulse",
        isBlocked
          ? "opacity-70 border-border"
          : "hover:border-primary/50",
      )}
    >
      <Accordion
        type="single"
        collapsible
        className="w-full"
        disabled={isProcessing}
      >
        <AccordionItem value={`step-${step.id}`} className="border-b-0">
          <AccordionTrigger
            className={cn(
              "p-4 hover:no-underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card data-[state=open]:pb-2 group rounded-t-lg",
              canExecuteStep && isHeaderHovered && "bg-primary/5 dark:bg-primary/10",
            )}
            onMouseEnter={() => setIsHeaderHovered(true)}
            onMouseLeave={() => setIsHeaderHovered(false)}
          >
            <StepCardHeader
              stepId={step.id}
              title={step.title}
              description={step.description}
              provider={step.provider}
              activity={step.activity}
              statusDisplay={statusDisplay}
              automatabilityDisplay={automatabilityDisplay}
              isProcessing={isProcessing}
            />
          </AccordionTrigger>
          <AccordionContent className="px-4 pt-0 pb-4">
            <div className="pl-8 space-y-4 pt-2">
              <StepCardDetailsSection title="Technical Details">
                <p className="text-sm text-muted-foreground">{step.details}</p>
              </StepCardDetailsSection>

              <StepCardDetailsSection
                title="Inputs"
                hasData={displayInputs.length > 0}
              >
                <StepCardInputsDisplay inputs={displayInputs} />
              </StepCardDetailsSection>

              <StepCardDetailsSection
                title="Outputs"
                hasData={displayOutputs.length > 0}
              >
                <StepCardOutputsDisplay outputs={displayOutputs} />
              </StepCardDetailsSection>

              <StepCardDetailsSection
                title="API Endpoints"
                hasData={
                  displayApiActions.filter((a) => !a.isManual || a.path)
                    .length > 0
                }
              >
                <StepCardApiActionsDisplay actions={displayApiActions} />
              </StepCardDetailsSection>

              {step.nextStep && (
                <StepCardDetailsSection title="Next Step">
                  <p className="text-sm text-muted-foreground">
                    {step.nextStep.description}
                  </p>
                </StepCardDetailsSection>
              )}

              {step.error && (
                <StepCardDetailsSection title="Error Details">
                  <p className="text-sm text-destructive/90 bg-destructive/10 p-2 rounded-md">
                    {step.error}
                  </p>
                </StepCardDetailsSection>
              )}

              {isCompleted && step.metadata?.resourceUrl && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary focus-visible:ring-primary"
                  >
                    <a
                      href={step.metadata.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Resource{" "}
                      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
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
          "p-3 border-t flex flex-wrap gap-2 items-center justify-between",
          isBlocked ? "bg-slate-50/50 dark:bg-slate-800/30" : "bg-card",
        )}
      >
        <StepCardFooterActions
          step={step}
          isBlocked={isBlocked}
          isCompleted={isCompleted}
          isProcessing={isProcessing}
          canExecute={canExecuteStep}
          allOutputs={outputs}
          onExecute={handleExecute}
          onMarkComplete={handleMarkComplete}
          onMarkIncomplete={handleMarkIncomplete}
          onRequestAdmin={handleRequestAdmin}
        />
      </CardFooter>
    </Card>
  );
}
