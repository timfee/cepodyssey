"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSelector } from "@/hooks/use-redux";
import { getStepInputs, getStepOutputs } from "@/lib/steps/metadata";
import type { StepId } from "@/lib/steps/step-refs";
import type { ManagedStep, StepStatusInfo, StepDefinition } from "@/lib/types";
import { StepStatus } from "@/lib/constants/enums";
import React from "react";
import { WorkflowStepCard } from "./workflow";

interface ProgressVisualizerProps {
  onExecuteStep: (stepId: StepId) => void;
}

export function ProgressVisualizer({ onExecuteStep }: ProgressVisualizerProps) {
  const stepsStatusMap = useAppSelector((state) => state.app.steps);
  const domain = useAppSelector((state) => state.app.domain);
  const tenantId = useAppSelector((state) => state.app.tenantId);
  const outputs = useAppSelector((state) => state.app.outputs);
  const canRunGlobalSteps = !!(domain && tenantId);

  const [stepDefs, setStepDefs] = React.useState<StepDefinition[]>([]);
  React.useEffect(() => {
    void (async () => {
      const { allStepDefinitions } = await import("@/lib/steps");
      setStepDefs(allStepDefinitions);
    })();
  }, []);

  const managedSteps: ManagedStep[] = React.useMemo(() => {
    return stepDefs.map((definition) => {
      const statusInfo: StepStatusInfo = stepsStatusMap[definition.id] || {
        status: StepStatus.PENDING,
      };

      let effectiveStatus = statusInfo.status;
      if (definition.requires && definition.requires.length > 0) {
        const requirementsMet = definition.requires.every((reqId) => {
          const req = stepsStatusMap[reqId as keyof typeof stepsStatusMap];
          return req && req.status === StepStatus.COMPLETED;
        });
        if (!requirementsMet && statusInfo.status === StepStatus.PENDING) {
          effectiveStatus = StepStatus.BLOCKED;
        }
      }

      return { ...definition, ...statusInfo, status: effectiveStatus };
    });
  }, [stepsStatusMap, stepDefs]);

  const categories = [
    { id: "all", label: "All Steps", steps: managedSteps },
    {
      id: "provisioning",
      label: "Provisioning",
      steps: managedSteps.filter((s) => s.activity === "Provisioning"),
    },
    {
      id: "sso",
      label: "SSO",
      steps: managedSteps.filter((s) => s.activity === "SSO"),
    },
    {
      id: "foundation",
      label: "Foundation",
      steps: managedSteps.filter((s) => s.activity === "Foundation"),
    },
  ];

  const getProgress = (steps: ManagedStep[]) => {
    const completed = steps.filter(
      (s) => s.status === StepStatus.COMPLETED,
    ).length;
    return steps.length > 0 ? (completed / steps.length) * 100 : 0;
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Progress</h2>
          <p className="text-muted-foreground">
            Track your setup progress below
          </p>
        </div>
        <TabsList>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
              {cat.id !== "all" && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {
                    cat.steps.filter((s) => s.status === StepStatus.COMPLETED)
                      .length
                  }
                  /{cat.steps.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {categories.map((cat) => (
        <TabsContent key={cat.id} value={cat.id} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Progress</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {
                    cat.steps.filter((s) => s.status === StepStatus.COMPLETED)
                      .length
                  }
                  /{cat.steps.length} done
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={getProgress(cat.steps)} className="h-2" />
            </CardContent>
          </Card>

          <ScrollArea className="h-[calc(100vh-24rem)]">
            <div className="flex flex-col gap-4 pr-4">
              {cat.steps.map((step) => (
                <WorkflowStepCard
                  key={step.id}
                  step={step}
                  allOutputs={outputs}
                  onExecute={onExecuteStep}
                  canRunGlobal={canRunGlobalSteps}
                  stepInputDefs={getStepInputs(stepDefs, step.id as StepId)}
                  stepOutputDefs={getStepOutputs(stepDefs, step.id as StepId)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
