"use client";

import { useAppSelector } from "@/hooks/use-redux";
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions } from "@/lib/steps";
import type { ManagedStep, StepStatusInfo } from "@/lib/types";
import { useSession } from "next-auth/react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";
import { StepCard } from "./step-card";

interface ProgressVisualizerProps {
  onExecuteStep: (stepId: string) => void;
}
/**
 * Displays progress for each automation step and allows execution.
 */

export function ProgressVisualizer({ onExecuteStep }: ProgressVisualizerProps) {
  const { data: session } = useSession();
  const stepsStatusMap = useAppSelector(
    (state: RootState) => state.setupSteps.steps,
  );
  const appConfig = useAppSelector((state: RootState) => state.appConfig);

  // Determine if all prerequisites for running steps are met.
  const canRunGlobalSteps = React.useMemo(
    () =>
      !!(
        appConfig.domain &&
        appConfig.tenantId &&
        session?.hasGoogleAuth &&
        session?.hasMicrosoftAuth
      ),
    [
      appConfig.domain,
      appConfig.tenantId,
      session?.hasGoogleAuth,
      session?.hasMicrosoftAuth,
    ],
  );

  const managedSteps: ManagedStep[] = React.useMemo(() => {
    return allStepDefinitions.map((definition) => {
      const dynamicStatusInfo: StepStatusInfo | undefined =
        stepsStatusMap[definition.id];
      return {
        ...definition,
        status: dynamicStatusInfo?.status ?? "pending",
        error: dynamicStatusInfo?.error,
        message: dynamicStatusInfo?.message,
        metadata: dynamicStatusInfo?.metadata ?? {},
      };
    });
  }, [stepsStatusMap]);

  const googleSteps = managedSteps.filter((s) => s.category === "Google");
  const microsoftSteps = managedSteps.filter((s) => s.category === "Microsoft");
  const ssoSteps = managedSteps.filter((s) => s.category === "SSO");

  if (managedSteps.length === 0) {
    return (
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Automation Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-muted-foreground py-10">
          <AlertTriangleIcon className="h-10 w-10 mb-3 text-orange-500" />
          <p className="font-semibold">No Automation Steps Defined</p>
          <p className="text-sm">
            Please check the application&apos;s step definitions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Automation Progress</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Complete the steps below to set up Google Workspace and Microsoft Entra ID integration.
        </p>
      </div>

      {/* Progress summary by category */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Google Workspace</p>
          <p className="text-2xl font-bold text-blue-600">
            {googleSteps.filter(s => s.status === "completed").length}/{googleSteps.length}
          </p>
        </div>
        <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Microsoft Entra ID</p>
          <p className="text-2xl font-bold text-purple-600">
            {microsoftSteps.filter(s => s.status === "completed").length}/{microsoftSteps.length}
          </p>
        </div>
        <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
          <p className="text-sm font-medium text-green-900 dark:text-green-100">SSO Configuration</p>
          <p className="text-2xl font-bold text-green-600">
            {ssoSteps.filter(s => s.status === "completed").length}/{ssoSteps.length}
          </p>
        </div>
      </div>

      {/* All steps in a responsive grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {managedSteps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            outputs={appConfig.outputs}
            onExecute={onExecuteStep}
            canRunGlobal={canRunGlobalSteps}
          />
        ))}
      </div>
    </div>
  );
}
