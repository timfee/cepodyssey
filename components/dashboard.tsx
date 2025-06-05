"use client";

import {
  AlertTriangleIcon,
  Loader2Icon,
  PlayIcon,
  LogInIcon,
  RefreshCw,
} from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useStepExecution } from "@/hooks/use-step-execution";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { setError } from "@/lib/redux/slices/errors";
import {
  loadProgress,
  saveProgress,
  type PersistedProgress,
} from "@/lib/redux/persistence";
import { addOutputs, initializeConfig } from "@/lib/redux/slices/app-config";
import {
  initializeSteps,
  updateStep,
  clearAllCheckTimestamps,
} from "@/lib/redux/slices/setup-steps";
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions } from "@/lib/steps";
import { executeStepCheck } from "@/app/actions/step-actions";
import { useAutoCheck } from "@/hooks/use-auto-check";
import type { StepId } from "@/lib/steps/step-refs";
import type { StepCheckResult } from "@/lib/types";
import type {
  AppConfigState as AppConfigTypeFromTypes,
  StepContext,
} from "@/lib/types";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
        toast.info("Previous progress restored", {
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

  const { executeStep } = useStepExecution();

  const handleExecute = useCallback(
    async (stepId: StepId) => {
      if (!canRunAutomation) {
        dispatch(
          setError({ message: 'Please sign in to both Google and Microsoft to continue.' })
        );
        return;
      }
      await executeStep(stepId);
    },
    [executeStep, canRunAutomation, dispatch]
  );

  const executeCheck = useCallback(
    async (stepId: StepId): Promise<StepCheckResult> => {
      if (!appConfig.domain || !appConfig.tenantId) {
        return { completed: false } as StepCheckResult;
      }

      // Set the step to in_progress state before checking
      dispatch(
        updateStep({
          id: stepId,
          status: "in_progress",
          message: "Checking status...",
        }),
      );

      const context: StepContext = {
        domain: appConfig.domain,
        tenantId: appConfig.tenantId,
        outputs: store.getState().appConfig.outputs,
      };

      try {
        const checkResult = await executeStepCheck(stepId, context);

        if (checkResult.outputs) {
          dispatch(addOutputs(checkResult.outputs));
        }

        if (checkResult.outputs?.errorCode === "AUTH_EXPIRED") {
          dispatch(
            setError({
              message:
                checkResult.message ||
                "Your session has expired. Please sign in again.",
            }),
          );

          dispatch(
            updateStep({
              id: stepId,
              status: "failed",
              error: "Authentication expired",
              metadata: {
                errorCode: "AUTH_EXPIRED",
                errorProvider: checkResult.outputs.errorProvider,
              },
              lastCheckedAt: new Date().toISOString(),
            }),
          );
          return checkResult;
        }

        if (!checkResult.completed && checkResult.outputs?.errorCode) {
          const errorMessage = checkResult.message || "Check failed";

          dispatch(
            updateStep({
              id: stepId,
              status: "failed",
              error: errorMessage,
              metadata: checkResult.outputs,
              lastCheckedAt: new Date().toISOString(),
            }),
          );

          if (checkResult.outputs.errorCode === "API_NOT_ENABLED") {
            dispatch(
              setError({
                message: errorMessage,
                details: { apiUrl: errorMessage.match(/https:\/\/[^\s]+/)?[0]: undefined },
              }),
            );
          } else {
            dispatch(
              setError({
                message: `Check Failed: ${errorMessage}`,
              }),
            );
          }
          return checkResult;
        }

        if (checkResult.completed) {
          dispatch(
            updateStep({
              id: stepId,
              status: "completed",
              message: checkResult.message || "Check passed",
              metadata: {
                preExisting: true,
                checkedAt: new Date().toISOString(),
                ...(checkResult.outputs || {}),
              },
              lastCheckedAt: new Date().toISOString(),
            }),
          );
        } else {
          // Reset to pending if check shows it's not completed
          dispatch(
            updateStep({
              id: stepId,
              status: "pending",
              message: checkResult.message || "Not completed",
              error: null,
              metadata: checkResult.outputs || {},
            }),
          );
        }
        return checkResult;
      } catch (error) {
        console.error(`Unexpected error in executeCheck for ${stepId}:`, error);

        dispatch(
          updateStep({
            id: stepId,
            status: "failed",
            error: error instanceof Error ? error.message : "Check failed",
            lastCheckedAt: new Date().toISOString(),
          }),
        );

        dispatch(
          setError({
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          }),
        );
        return { completed: false } as StepCheckResult;
      }
    },
    [appConfig.domain, appConfig.tenantId, dispatch, store],
  );

  const { manualRefresh, isChecking } = useAutoCheck(executeCheck);

  const runAllPending = useCallback(async () => {
    if (!canRunAutomation) {
      // toast.error(
      //   "Complete setup to run automation",
      // );
      return;
    }
    toast.info("Running automation...", {
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
        await handleExecute(step.id as StepId);
        if (store.getState().setupSteps.steps[step.id]?.status === "failed") {
          // toast.error("Automation paused", {
          //   description: `Check the error in ${step.title}`,
          //   duration: 10000,
          // });
          anyStepFailed = true;
          break;
        }
      }
    }
    if (!anyStepFailed) {
      toast.success("All steps completed", {
        duration: 5000,
      });
    }
  }, [handleExecute, store, canRunAutomation]);

  const ProgressSummary = () => {
    const totalSteps = allStepDefinitions.length;
    const completedSteps = Object.values(stepsStatusMap).filter(
      (s) => s.status === "completed",
    ).length;
    const progressPercent = (completedSteps / totalSteps) * 100;

    const refreshChecks = useCallback(async () => {
      if (!canRunAutomation) {
        return;
      }
      dispatch(clearAllCheckTimestamps());
      toast.info("Refreshing step status...", { duration: 2000 });

      await manualRefresh();

      toast.success("Status refreshed", { duration: 2000 });
    }, [canRunAutomation, manualRefresh, dispatch]);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                {completedSteps}/{totalSteps} done
              </CardDescription>
            </div>
            {canRunAutomation && (
              <Button
                variant="outline"
                size="sm"
                onClick={refreshChecks}
                title="Refresh status from server"
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />

          {canRunAutomation && completedSteps < totalSteps && (
            <Button onClick={runAllPending} className="w-full" size="lg">
              <PlayIcon className="mr-2 h-5 w-5" />
              Run all ({totalSteps - completedSteps} remaining)
            </Button>
          )}
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
    ((!session?.hasGoogleAuth || !session?.hasMicrosoftAuth) ||
      (session?.error as unknown as string) === 'MissingTokens' ||
      session?.error === 'RefreshTokenError') &&
    (appConfig.domain || appConfig.tenantId)
  ) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Your session is invalid. Please sign out completely and sign in
            again with both Google and Microsoft.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-4 w-full"
          size="lg"
        >
          <LogInIcon className="mr-2 h-5 w-5" />
          Sign Out and Start Over
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
            Google + Microsoft Integration
          </h1>
          <p className="mt-1 text-muted-foreground">
            Connect your directories in minutes
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
                    Sign in with Google to detect your domain
                  </li>
                )}
                {!appConfig.tenantId && !session?.microsoftTenantId && (
                  <li>
                    Sign in with Microsoft to detect your Tenant ID
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
              <p className="mt-2">Complete all requirements to continue</p>
            </AlertDescription>
          </Alert>
        )}
        <ProgressVisualizer onExecuteStep={handleExecute} />
      </main>
    </div>
  );
}
