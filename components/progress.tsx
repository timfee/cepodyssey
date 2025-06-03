// ./components/progress.tsx
"use client";

import { useAppSelector } from "@/hooks/use-redux"; // Path from your project-code.md
import type { RootState } from "@/lib/redux/store"; // Explicitly import RootState
import { allStepDefinitions } from "@/lib/steps";
import type { ManagedStep, StepStatusInfo } from "@/lib/types"; // Using your main types file
import { useSession } from "next-auth/react"; // Import useSession
import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react"; // For the "No steps" message
import { StepItem } from "./step"; // Correct path from your project-code.md

interface ProgressVisualizerProps {
  onExecuteStep: (stepId: string) => void;
  // canRunGlobalSteps will now be determined internally using useSession
}

export function ProgressVisualizer({ onExecuteStep }: ProgressVisualizerProps) {
  const { data: session } = useSession(); // Get session data for auth status
  const stepsStatusMap = useAppSelector(
    (state: RootState) => state.setupSteps.steps
  );
  const appConfig = useAppSelector((state: RootState) => state.appConfig);

  // Derive canRunGlobalSteps based on necessary config and auth states from session
  const canRunGlobalSteps = React.useMemo(
    () =>
      !!(
        appConfig.domain &&
        appConfig.tenantId &&
        session?.hasGoogleAuth && // Use session for auth status
        session?.hasMicrosoftAuth
      ),
    [
      appConfig.domain,
      appConfig.tenantId,
      session?.hasGoogleAuth,
      session?.hasMicrosoftAuth,
    ]
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

  const renderStepList = (
    title: string,
    stepsToList: ManagedStep[],
    categoryKey: string
  ) => (
    <div key={categoryKey} className="flex flex-col">
      <h3 className="mb-6 text-xl font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 pb-3">
        {title}
      </h3>
      {stepsToList.length > 0 ? (
        <ol className="relative">
          {stepsToList.map((step, index) => (
            <StepItem
              key={step.id}
              step={step}
              isLastStep={index === stepsToList.length - 1}
              onExecuteStepAction={onExecuteStep}
              canRunGlobal={canRunGlobalSteps}
            />
          ))}
        </ol>
      ) : (
        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border border-dashed rounded-md">
          No steps defined for this category.
        </div>
      )}
    </div>
  );

  if (managedSteps.length === 0) {
    // Handling if allStepDefinitions is empty
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
    <Card className="mt-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Automation Progress
        </CardTitle>
        <CardDescription>
          Follow these steps to complete the integration. Manual steps require
          your input. Automated steps can be run individually or via &quot;Run
          All Pending&quot;.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-x-6 gap-y-10 lg:grid-cols-3">
        {renderStepList("Google Workspace Setup", googleSteps, "google")}
        {renderStepList(
          "Microsoft Entra ID Provisioning Setup",
          microsoftSteps,
          "microsoft"
        )}
        {renderStepList("Single Sign-On (SSO) Setup", ssoSteps, "sso")}
      </CardContent>
    </Card>
  );
}
