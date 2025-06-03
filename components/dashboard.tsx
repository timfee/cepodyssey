"use client";

import { AlertTriangleIcon, Loader2Icon, PlayIcon, LogInIcon } from "lucide-react";
import type { Session } from "next-auth";
import { isAuthenticationError } from "@/lib/api/auth-interceptor";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import {
  loadProgress,
  saveProgress,
  type PersistedProgress,
} from "@/lib/redux/persistence";
import { addOutputs, initializeConfig } from "@/lib/redux/slices/app-config";
import { initializeSteps, updateStep } from "@/lib/redux/slices/setup-steps";
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions, getStepActions } from "@/lib/steps";
import { useAutoCheck } from "@/hooks/use-auto-check";
import type {
  AppConfigState as AppConfigTypeFromTypes,
  StepCheckResult,
  StepContext,
  StepExecutionResult,
} from "@/lib/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthStatus } from "./auth";
import { ConfigForm } from "./form";
import { ProgressVisualizer } from "./progress";
import { SessionWarning } from "./session-warning";

interface AutomationDashboardProps {
  serverSession: Session;
  initialConfig?: Partial<AppConfigTypeFromTypes>;
}
/**
 * Main dashboard component handling setup progress and automation actions.
 */

export function AutomationDashboard({
  serverSession,
  initialConfig,
}: AutomationDashboardProps) {
  const { session, status } = useSessionSync();
  const router = useRouter();

  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const appConfig = useAppSelector((state: RootState) => state.appConfig);
  const stepsStatusMap = useAppSelector(
    (state: RootState) => state.setupSteps.steps,
  );

  const isLoadingSession = status === "loading";
  const currentSession = session ?? serverSession;

  // Effect: initialize Redux config from server session values.
  useEffect(() => {
    // Only run when Redux lacks domain/tenant or new values are provided.
    if (
      initialConfig &&
      (initialConfig.domain !== appConfig.domain ||
        initialConfig.tenantId !== appConfig.tenantId ||
        (initialConfig.domain && !appConfig.domain) ||
        (initialConfig.tenantId && !appConfig.tenantId))
    ) {
      console.log(
        "AutomationDashboard: Initializing Redux with config from server session props:",
        initialConfig,
      );
      dispatch(
        initializeConfig({
          domain: initialConfig.domain ?? null,
          tenantId: initialConfig.tenantId ?? null,
          outputs: initialConfig.outputs ?? {},
        }),
      );
    } else if (!initialConfig && (!appConfig.domain || !appConfig.tenantId)) {
      console.log(
        "AutomationDashboard: No initialConfig prop, and Redux domain/tenant is empty. This might happen if session didn't have domain/tenant.",
      );
    }
  }, [dispatch, initialConfig, appConfig.domain, appConfig.tenantId]);

  // Effect: load saved progress from localStorage.
  useEffect(() => {
    if (appConfig.domain && appConfig.domain !== "") {
      const persisted: PersistedProgress | null = loadProgress(
        appConfig.domain,
      );
      if (persisted) {
        dispatch(initializeSteps(persisted.steps));
        // Merge outputs saved for this domain.
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
      }
    }
  }, [appConfig.domain, dispatch]);

  // Effect: persist Redux state for this domain.
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
    ],
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
            id: stepId,
            status: "failed",
            error: "Step definition not found.",
          }),
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
          }),
        );
        return;
      }
      dispatch(
        updateStep({
          id: stepId,
          status: "in_progress",
          error: null,
          message: undefined,
        }),
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
          }),
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
              }),
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
            }),
          );
          toast.success(`${definition.title}: Execution successful!`, {
            id: toastId,
          });
        } else {
          dispatch(
            updateStep({
              id: stepId,
              status: "failed",
              error: result.error?.message ?? "Unknown error during execution.",
              message: result.message,
            }),
          );
          toast.error(
            `${definition.title}: Execution failed. ${
              result.error?.message ?? ""
            }`,
            { id: toastId, duration: 10000 },
          );
        }
      } catch (err) {
        if (isAuthenticationError(err)) {
          toast.error(err.message, {
            duration: 10000,
            action: {
              label: "Sign In",
              onClick: () => router.push("/login"),
            },
          });
          dispatch(
            updateStep({
              id: stepId,
              status: "failed",
              error: err.message,
              metadata: {
                errorCode: "AUTH_EXPIRED",
                errorProvider: err.provider,
              },
            }),
          );
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        dispatch(updateStep({ id: stepId, status: "failed", error: message }));
        toast.error(`${definition.title}: Unexpected error. ${message}`, {
          id: toastId,
          duration: 10000,
        });
      }
    },
    [
      canRunAutomation,
      dispatch,
      store,
      appConfig.domain,
      appConfig.tenantId,
      router,
    ],
  );

  const executeCheck = useCallback(
    async (stepId: string) => {
      const definition = allStepDefinitions.find((s) => s.id === stepId);
      if (!definition?.check) return;

      if (!appConfig.domain || !appConfig.tenantId) return;

      const context: StepContext = {
        domain: appConfig.domain,
        tenantId: appConfig.tenantId,
        outputs: store.getState().appConfig.outputs,
      };

      try {
        const checkResult = await definition.check(context);

        if (checkResult.outputs) {
          dispatch(addOutputs(checkResult.outputs));
        }

        if (checkResult.completed) {
          dispatch(
            updateStep({
              id: stepId,
              status: "completed",
              message: checkResult.message || "Pre-existing resource found",
              metadata: {
                preExisting: true,
                checkedAt: new Date().toISOString(),
                ...(checkResult.outputs || {}),
              },
            }),
          );
        }
      } catch (error) {
        console.error(`Auto-check failed for ${stepId}:`, error);
      }
    },
    [appConfig.domain, appConfig.tenantId, dispatch, store],
  );

  useAutoCheck(executeCheck);

  const runAllPending = useCallback(async () => {
    if (!canRunAutomation) {
      toast.error(
        "Complete configuration and authentication to run all steps.",
      );
      return;
    }
    toast.info("Starting automation for pending runnable steps...", {
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
          toast.error("Automation stopped: failed step.", {
            description: `Review error for: ${step.title}`,
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

  const ProgressSummary = () => {
    const totalSteps = allStepDefinitions.length;
    const completedSteps = Object.values(stepsStatusMap).filter(
      (s) => s.status === "completed",
    ).length;
    const progressPercent = (completedSteps / totalSteps) * 100;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Setup Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {completedSteps} of {totalSteps} steps completed
                </span>
                <span className="font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {canRunAutomation && completedSteps < totalSteps && (
              <Button onClick={runAllPending} className="w-full" size="lg">
                <PlayIcon className="mr-2 h-5 w-5" />
                Run All Pending Steps ({totalSteps - completedSteps} remaining)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingSession && !currentSession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2Icon className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const showActionRequired =
    (!appConfig.domain ||
      !appConfig.tenantId ||
      !currentSession?.hasGoogleAuth ||
      !currentSession?.hasMicrosoftAuth) &&
    !isLoadingSession;

  if (
    status === "authenticated" &&
    (!session?.hasGoogleAuth || !session?.hasMicrosoftAuth) &&
    (appConfig.domain || appConfig.tenantId)
  ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Your session has expired. Please sign in again to continue automation.
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/login") } className="mt-4 w-full" size="lg">
            <LogInIcon className="mr-2 h-5 w-5" />
            Return to Login
          </Button>
        </div>
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
        <SessionWarning />
        <ConfigForm />
        <AuthStatus />
        <ProgressSummary />
        {showActionRequired && (
          <Alert
            variant="default"
            className="border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-200"
          >
            <AlertTriangleIcon className="h-5 w-5 !text-orange-500 dark:!text-orange-400" />
            <AlertTitle className="font-semibold">Action Required</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-5 mt-1">
                {!appConfig.domain && !session?.authFlowDomain && (
                  <li>
                    Google Workspace domain not identified from session. Please
                    re-login with Google if needed.
                  </li>
                )}
                {!appConfig.tenantId && !session?.microsoftTenantId && (
                  <li>
                    Microsoft Entra ID Tenant ID not identified from session.
                    Please re-login with Microsoft if needed.
                  </li>
                )}
                {(appConfig.domain || session?.authFlowDomain) &&
                  (appConfig.tenantId || session?.microsoftTenantId) &&
                  !currentSession?.hasGoogleAuth && (
                    <li>Connect to Google Workspace.</li>
                  )}
                {(appConfig.domain || session?.authFlowDomain) &&
                  (appConfig.tenantId || session?.microsoftTenantId) &&
                  !currentSession?.hasMicrosoftAuth && (
                    <li>Connect to Microsoft Entra ID.</li>
                  )}
              </ul>
              <p className="mt-2">
                All prerequisites must be met to enable automation steps.
              </p>
            </AlertDescription>
          </Alert>
        )}
        <ProgressVisualizer onExecuteStep={executeStep} />
      </main>
    </div>
  );
}
