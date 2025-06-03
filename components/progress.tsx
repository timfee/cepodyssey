"use client";

import { useAppSelector } from "@/hooks/use-redux";
import { allStepDefinitions } from "@/lib/steps";
import type { ManagedStep } from "@/lib/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StepItem } from "./step";

interface ProgressVisualizerProps {
  onExecuteStep: (stepId: string) => void;
}

export function ProgressVisualizer({ onExecuteStep }: ProgressVisualizerProps) {
  const stepsStatus = useAppSelector((state) => state.setupSteps.steps);

  const managedSteps: ManagedStep[] = allStepDefinitions.map((def) => ({
    ...def,
    ...(stepsStatus[def.id] ?? { status: "pending" }),
  }));

  const googleSteps = managedSteps.filter((s) => s.category === "Google");
  const microsoftSteps = managedSteps.filter((s) => s.category === "Microsoft");
  const ssoSteps = managedSteps.filter((s) => s.category === "SSO");

  const renderStepList = (title: string, steps: ManagedStep[]) => (
    <div>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ol className="relative border-l border-border">
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            onExecuteStep={onExecuteStep}
            isLast={index === steps.length - 1}
          />
        ))}
      </ol>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automation Progress</CardTitle>
        <CardDescription>
          Track and execute the steps needed to complete the integration.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-12 lg:grid-cols-3">
        {renderStepList("Google Workspace Setup", googleSteps)}
        {renderStepList("Microsoft Entra ID Setup", microsoftSteps)}
        {renderStepList("Single Sign-On (SSO) Setup", ssoSteps)}
      </CardContent>
    </Card>
  );
}
