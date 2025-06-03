// ./components/dashboard.tsx
"use client";

import {
  AlertTriangleIcon,
  CheckCircleIcon,
  Loader2Icon,
  PlayIcon,
} from "lucide-react"; // Added CheckCircleIcon
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useMemo } from "react"; // Imported React
import { useStore } from "react-redux";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/hooks/use-redux"; // Corrected path based on your components.json
import {
  loadProgress,
  saveProgress,
  type PersistedProgress,
} from "@/lib/redux/persistence";
import {
  addOutputs,
  initializeConfig, // Use the dedicated initializer
} from "@/lib/redux/slices/app-config"; // Corrected slice name based on your AGENTS.md and project-code.md
import { initializeSteps, updateStep } from "@/lib/redux/slices/setup-steps"; // Corrected slice name
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions, getStepActions } from "@/lib/steps";
import type {
  AppConfigState as AppConfigTypeFromTypes,
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types"; // Updated path based on your project-code.md

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthStatus } from "./auth"; // Path from your project-code.md
import { ConfigForm } from "./form"; // Path from your project-code.md
import { ProgressVisualizer } from "./progress"; // Path from your project-code.md

interface AutomationDashboardProps {
  serverSession: Session; // Passed from server component for initial render
  initialConfig?: Partial<AppConfigTypeFromTypes>;
}

export function AutomationDashboard({
  serverSession,
  initialConfig,
}: AutomationDashboardProps) {
  const { data: session, status } = useSession({
    required: true, // Ensures user is authenticated or redirects
  });

  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const appConfig = useAppSelector((state: RootState) => state.appConfig);
  const stepsStatusMap = useAppSelector(
    (state: RootState) => state.setupSteps.steps
  );

  const isLoadingSession = status === "loading";
  const currentSession = session ?? serverSession;

  // Effect 1: Initialize Redux config from server-provided initialConfig or login page's localStorage
  useEffect(() => {
    if (initialConfig && (initialConfig.domain || initialConfig.tenantId)) {
      console.log(
        "AutomationDashboard: Initializing Redux with server config:",
        initialConfig
      );
      dispatch(
        initializeConfig({
          domain: initialConfig.domain ?? null,
          tenantId: initialConfig.tenantId ?? null,
          outputs: initialConfig.outputs ?? {},
        })
      );
      // Clear login page localStorage items once config is sourced from server
      localStorage.removeItem("loginPageDomain");
      localStorage.removeItem("loginPageTenantId");
    } else if (!appConfig.domain && !appConfig.tenantId) {
      // Only if Redux is still empty and no server config
      const loginDomain = localStorage.getItem("loginPageDomain");
      const loginTenantId = localStorage.getItem("loginPageTenantId");
      if (loginDomain || loginTenantId) {
        console.log(
          "AutomationDashboard: Initializing Redux with loginPage localStorage (fallback):",
          { domain: loginDomain, tenantId: loginTenantId }
        );
        dispatch(
          initializeConfig({
            domain: loginDomain,
            tenantId: loginTenantId,
            outputs: {}, // Outputs are loaded separately by domain key later
          })
        );
        // Optionally clear these after use too, or rely on login page to clear them on successful dual auth + server save.
      }
    }
  }, [dispatch, initialConfig, appConfig.domain, appConfig.tenantId]); // Rerun if initialConfig changes or if Redux domain/tenantId were initially null

  // Effect 2: Load step progress & step-specific outputs from localStorage, keyed by domain.
  useEffect(() => {
    if (appConfig.domain && appConfig.domain !== "") {
      console.log(
        "AutomationDashboard: Domain available in Redux, attempting to load progress for domain:",
        appConfig.domain
      );
      const persisted: PersistedProgress | null = loadProgress(
        appConfig.domain
      );
      if (persisted) {
        dispatch(initializeSteps(persisted.steps));
        dispatch(addOutputs(persisted.outputs || {}));
        toast.info("Loaded saved step progress for this domain.", {
          duration: 2000,
        });
      } else {
        const initialStepStatuses: Record<string, { status: "pending" }> = {};
        allStepDefinitions.forEach((def) => {
          initialStepStatuses[def.id] = { status: "pending" };
        });
        dispatch(initializeSteps(initialStepStatuses));
        console.log(
          "AutomationDashboard: No persisted progress for domain, initialized steps to pending."
        );
      }
    }
  }, [appConfig.domain, dispatch]); // Runs when appConfig.domain is set/changed in Redux

  // Effect 3: Persist current Redux state (steps and outputs) to localStorage whenever they change.
  useEffect(() => {
    if (appConfig.domain && appConfig.domain !== "") {
      saveProgress(appConfig.domain, {
        steps: stepsStatusMap,
        outputs: appConfig.outputs,
      });
    }
  }, [appConfig.domain, appConfig.outputs, stepsStatusMap]);

  const canRunAutomation = useMemo(
    () =>
      !!(
        currentSession?.hasGoogleAuth &&
        currentSession?.hasMicrosoftAuth &&
        appConfig.domain &&
        appConfig.tenantId
      ),
    [
      currentSession?.hasGoogleAuth,
      currentSession?.hasMicrosoftAuth,
      appConfig.domain,
      appConfig.tenantId,
    ]
  );

  const executeStep = useCallback(
    async (stepId: string) => {
      if (!canRunAutomation) {
        toast.error("Please complete configuration and authentication first.");
        return;
      }
      const definition = allStepDefinitions.find((s) => s.id === stepId);
      if (!definition) {
        toast.error(`Step definition '${stepId}' not found.`);
        dispatch(
          updateStep({
            // Changed from setStepStatus to updateStep
            id: stepId,
            status: "failed",
            error: "Step definition not found.",
          })
        );
        return;
      }
      const stepActionImplementations = getStepActions(stepId);
      if (!stepActionImplementations?.execute) {
        toast.error(`Execute function for step '${stepId}' not found.`);
        dispatch(
          updateStep({
            id: stepId,
            status: "failed",
            error: "Step execution logic not found.",
          })
        );
        return;
      }

      dispatch(
        updateStep({
          id: stepId,
          status: "in_progress",
          error: null,
          message: undefined,
        })
      );
      const toastId = `step-exec-${stepId}-${Date.now()}`;
      toast.loading(`Running: ${definition.title}...`, { id: toastId });

      if (!appConfig.domain || !appConfig.tenantId) {
        toast.error("Domain or Tenant ID is missing in configuration.", {
          id: toastId,
        });
        dispatch(
          updateStep({
            id: stepId,
            status: "failed",
            error: "Domain or Tenant ID missing.",
          })
        );
        return;
      }
      const context: StepContext = {
        domain: appConfig.domain,
        tenantId: appConfig.tenantId,
        outputs: store.getState().appConfig.outputs,
      };

      try {
        if (definition.automatable && stepActionImplementations.check) {
          // Only run check if automatable
          const checkResult: StepCheckResult =
            await stepActionImplementations.check(context);
          if (checkResult.outputs) dispatch(addOutputs(checkResult.outputs));
          if (checkResult.completed) {
            dispatch(
              updateStep({
                id: stepId,
                status: "completed",
                message: checkResult.message || "Already completed.",
                metadata: {
                  preExisting: true,
                  completedAt: new Date().toISOString(),
                  ...(checkResult.outputs || {}),
                },
              })
            );
            toast.success(`${definition.title}: Checked - Already complete.`, {
              id: toastId,
            });
            return;
          }
        }
        const result: StepExecutionResult =
          await stepActionImplementations.execute(context);
        if (result.outputs) dispatch(addOutputs(result.outputs));
        if (result.success) {
          dispatch(
            updateStep({
              id: stepId,
              status: "completed",
              message: result.message,
              metadata: {
                resourceUrl: result.resourceUrl,
                completedAt: new Date().toISOString(),
                ...(result.outputs || {}),
              },
            })
          );
          toast.success(`${definition.title}: Execution successful!`, {
            id: toastId,
          });
        } else {
          dispatch(
            updateStep({
              id: stepId,
              status: "failed",
              error:
                result.error?.message ??
                "An unknown error occurred during execution.",
              message: result.message,
            })
          );
          toast.error(
            `${definition.title}: Execution failed. ${
              result.error?.message ?? ""
            }`,
            { id: toastId, duration: 10000 }
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        dispatch(updateStep({ id: stepId, status: "failed", error: message }));
        toast.error(
          `${definition.title}: An unexpected error occurred. ${message}`,
          {
            id: toastId,
            duration: 10000,
          }
        );
      }
    },
    [canRunAutomation, dispatch, store, appConfig.domain, appConfig.tenantId]
  );

  const runAllPending = useCallback(async () => {
    if (!canRunAutomation) {
      toast.error(
        "Please complete configuration and authentication first to run all steps."
      );
      return;
    }
    toast.info("Starting automation for all pending and runnable steps...", {
      duration: 5000,
    });
    let anyStepFailed = false;
    for (const step of allStepDefinitions) {
      const currentStepState = store.getState().setupSteps.steps[step.id];
      if (
        step.automatable &&
        (!currentStepState ||
          currentStepState.status === "pending" ||
          currentStepState.status === "failed")
      ) {
        await executeStep(step.id);
        if (store.getState().setupSteps.steps[step.id]?.status === "failed") {
          toast.error("Automation stopped due to a failed step.", {
            description: `Please review the error for step: ${step.title}`,
            duration: 10000,
          });
          anyStepFailed = true;
          break;
        }
      }
    }
    if (!anyStepFailed) {
      toast.success("Automation sequence for pending steps complete.", {
        duration: 5000,
      });
    }
  }, [executeStep, store, canRunAutomation]);

  if (isLoadingSession && !currentSession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <main className="container mx-auto max-w-5xl space-y-8 p-4 py-8 md:p-8">
        <header className="border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Directory Setup Assistant
          </h1>
          <p className="mt-1 text-muted-foreground">
            Automate Google Workspace & Microsoft Entra ID Integration
          </p>
        </header>

        <ConfigForm />
        <AuthStatus />

        {(!appConfig.domain ||
          !appConfig.tenantId ||
          !currentSession?.hasGoogleAuth ||
          !currentSession?.hasMicrosoftAuth) &&
          !isLoadingSession && (
            <Card className="border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/30">
              <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
                <AlertTriangleIcon className="h-6 w-6 shrink-0 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-sm text-orange-700 dark:text-orange-300">
                <ul className="list-disc space-y-1 pl-5">
                  {!appConfig.domain && (
                    <li>
                      Provide your Google Workspace primary domain in the
                      configuration form.
                    </li>
                  )}
                  {!appConfig.tenantId && (
                    <li>
                      Provide your Microsoft Entra ID Tenant ID in the
                      configuration form.
                    </li>
                  )}
                  {appConfig.domain &&
                    appConfig.tenantId &&
                    !currentSession?.hasGoogleAuth && (
                      <li>
                        Connect to Google Workspace using the 'Authentication
                        Status' section.
                      </li>
                    )}
                  {appConfig.domain &&
                    appConfig.tenantId &&
                    !currentSession?.hasMicrosoftAuth && (
                      <li>
                        Connect to Microsoft Entra ID using the 'Authentication
                        Status' section.
                      </li>
                    )}
                </ul>
                <p className="mt-2">
                  All these must be completed to enable the automation steps.
                </p>
              </CardContent>
            </Card>
          )}

        <div className="flex justify-end pt-4">
          <Button
            onClick={runAllPending}
            disabled={!canRunAutomation || isLoadingSession}
            size="lg"
          >
            <PlayIcon className="mr-2 h-5 w-5" />
            Run All Pending Automatable Steps
          </Button>
        </div>

        <ProgressVisualizer onExecuteStep={executeStep} />
      </main>
    </div>
  );
}
