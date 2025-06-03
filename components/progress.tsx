"use client";

import { useAppSelector } from "@/hooks/use-redux";
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions } from "@/lib/steps";
import type { ManagedStep, StepStatusInfo } from "@/lib/types";
import { useSession } from "next-auth/react";
import React from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangleIcon } from "lucide-react";
import { CollapsibleStep } from "./collapsible-step";

interface ProgressVisualizerProps {
  onExecuteStep: (stepId: string) => void;
}
/**
 * Displays progress for each automation step and allows execution.
 */

export function ProgressVisualizer({ onExecuteStep }: ProgressVisualizerProps) {
  const { data: session } = useSession();
  const stepsStatusMap = useAppSelector(
    (state: RootState) => state.setupSteps.steps
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
  ) => {
    const completedCount = stepsToList.filter(s => s.status === "completed").length;
    const totalCount = stepsToList.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
      <div key={categoryKey} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{completedCount} of {totalCount} completed</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {stepsToList.map((step, index) => (
            <CollapsibleStep
              key={step.id}
              step={step}
              isLastStep={index === stepsToList.length - 1}
              onExecuteStepAction={onExecuteStep}
              canRunGlobal={canRunGlobalSteps}
            />
          ))}
        </div>
      </div>
    );
  };

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
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Automation Progress</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Click on steps to expand details. Automated steps can be run individually or via Run All Pending.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-3">
        {renderStepList("Google Workspace", googleSteps, "google")}
        {renderStepList("Microsoft Entra ID", microsoftSteps, "microsoft")}
        {renderStepList("Single Sign-On", ssoSteps, "sso")}
      </div>
    </div>
  );
}
