"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/hooks/use-redux";
import { allStepDefinitions } from "@/lib/steps";
import type { ManagedStep, StepStatusInfo } from "@/lib/types";
import React from "react";
import { StepCard } from "./step-card";

interface ProgressVisualizerProps {
  onExecuteStep: (stepId: string) => void;
}

export function ProgressVisualizer({ onExecuteStep }: ProgressVisualizerProps) {
  const stepsStatusMap = useAppSelector((state) => state.setupSteps.steps);
  const appConfig = useAppSelector((state) => state.appConfig);
  const canRunGlobalSteps = !!(appConfig.domain && appConfig.tenantId);

  const managedSteps: ManagedStep[] = React.useMemo(() => {
    return allStepDefinitions.map((definition) => {
      const statusInfo: StepStatusInfo = stepsStatusMap[definition.id] || {
        status: "pending",
      };
      return { ...definition, ...statusInfo };
    });
  }, [stepsStatusMap]);

  const categories = [
    { id: "all", label: "All Steps", steps: managedSteps },
    {
      id: "google",
      label: "Google",
      steps: managedSteps.filter((s) => s.category === "Google"),
    },
    {
      id: "microsoft",
      label: "Microsoft",
      steps: managedSteps.filter((s) => s.category === "Microsoft"),
    },
    {
      id: "sso",
      label: "SSO",
      steps: managedSteps.filter((s) => s.category === "SSO"),
    },
  ];

  const getProgress = (steps: ManagedStep[]) => {
    const completed = steps.filter((s) => s.status === "completed").length;
    return steps.length > 0 ? (completed / steps.length) * 100 : 0;
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <div className="flex items-center justify-between mb-6">
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
                  {cat.steps.filter((s) => s.status === "completed").length}/
                  {cat.steps.length}
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
                  {cat.steps.filter((s) => s.status === "completed").length}/{cat.steps.length} done
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={getProgress(cat.steps)} className="h-2" />
            </CardContent>
          </Card>

          <ScrollArea className="h-[calc(100vh-24rem)]">
            <div className="flex flex-col gap-4 pr-4 max-w-3xl mx-auto">
              {cat.steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  outputs={appConfig.outputs}
                  onExecute={onExecuteStep}
                  canRunGlobal={canRunGlobalSteps}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}
