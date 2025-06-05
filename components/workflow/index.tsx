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
  markStepComplete as markStepCompleteAction,
  markStepIncomplete as markStepIncompleteAction,
} from "@/lib/redux/slices/setup-steps";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  DisplayApiAction,
  DisplayInput,
  DisplayOutput,
  StepId,
  WorkflowStepCardProps,
} from "./workflow-types";

import {
  getAutomatabilityDisplayConfig,
  getStatusDisplayConfig,
} from "./config";
import { StepCardApiActionsDisplay } from "./step-card-api-actions-display";
import { StepCardDetailsSection } from "./step-card-details-section";
import { StepCardFooterActions } from "./step-card-footer-actions";
import { StepCardHeader } from "./step-card-header";
import { StepCardInputsDisplay } from "./step-card-inputs-display";
import { StepCardOutputsDisplay } from "./step-card-outputs-display";
import { parseApiAction } from "./utils";

export function WorkflowStepCard({
  step,
  allOutputs,
  canRunGlobal,
  onExecute: executeCallback,
  stepInputDefs,
  stepOutputDefs,
}: WorkflowStepCardProps) {
  const dispatch = useAppDispatch();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  const statusDisplay = useMemo(
    () => getStatusDisplayConfig(step.status, step.completionType),
    [step.status, step.completionType]
  );
  const automatabilityDisplay = useMemo(
    () => getAutomatabilityDisplayConfig(step.automatability),
    [step.automatability]
  );

  const isProcessing = step.status === "in_progress";
  const isCompleted = step.status === "completed";
  const isBlocked = step.status === "blocked";

  const canExecuteStep = useMemo(() => {
    if (!canRunGlobal || isProcessing || isCompleted || isBlocked) return false;
    return true;
  }, [canRunGlobal, isProcessing, isCompleted, isBlocked]);

  const displayInputs: DisplayInput[] = useMemo(() => {
    return stepInputDefs.map((def) => ({
      key: def.data.key,
      description: def.data.description,
      currentValue: allOutputs[def.data.key!],
      sourceStepTitle: def.stepTitle,
    }));
  }, [stepInputDefs, allOutputs]);

  const displayOutputs: DisplayOutput[] = useMemo(() => {
    return stepOutputDefs.map((def) => ({
      key: def.key,
      description: def.description,
      currentValue: allOutputs[def.key],
    }));
  }, [stepOutputDefs, allOutputs]);

  const displayApiActions: DisplayApiAction[] = useMemo(() => {
    return (step.actions ?? []).map((action) =>
      parseApiAction(action, allOutputs)
    );
  }, [step.actions, allOutputs]);

  const handleExecute = () => executeCallback(step.id as StepId);
  const handleMarkComplete = () =>
    dispatch(markStepCompleteAction({ id: step.id, isUserMarked: true }));
  const handleMarkIncomplete = () =>
    dispatch(markStepIncompleteAction(step.id));
  const handleRequestAdmin = () => dispatch(openAskAdminModal({ step }));

  return (
    <Card
      className={cn(
        "w-full transition-all duration-200 ease-in-out shadow-sm hover:shadow-md",
        isProcessing && "animate-pulse",
        isBlocked ? "opacity-70 border-border" : "hover:border-primary/50"
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
              canExecuteStep && isHeaderHovered && "bg-primary/5"
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
            <div className="space-y-4 pt-2 pl-8">
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
                  <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive/90">
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
                    className="border-primary/50 text-primary hover:bg-primary/5 hover:text-primary focus-visible:ring-primary"
                  >
                    <a
                      href={step.metadata.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Resource{" "}
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
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
          "flex flex-wrap items-center justify-between gap-2 border-t p-3",
          isBlocked ? "bg-slate-50/50 dark:bg-slate-800/30" : "bg-card"
        )}
      >
        <StepCardFooterActions
          step={step}
          isBlocked={isBlocked}
          isCompleted={isCompleted}
          isProcessing={isProcessing}
          canExecute={canExecuteStep}
          allOutputs={allOutputs}
          onExecute={handleExecute}
          onMarkComplete={handleMarkComplete}
          onMarkIncomplete={handleMarkIncomplete}
          onRequestAdmin={handleRequestAdmin}
        />
      </CardFooter>
    </Card>
  );
}
