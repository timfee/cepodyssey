// ./components/setup/AutomationDashboard.tsx
"use client";

import { AlertTriangleIcon, Loader2Icon, PlayIcon } from "lucide-react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { loadProgress, saveProgress } from "@/lib/redux/persistence";
import { addOutputs } from "@/lib/redux/slices/app-config";
import { initializeSteps, updateStep } from "@/lib/redux/slices/setup-steps";
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions, getStepActions } from "@/lib/steps"; // Corrected import
import type {
  StepCheckResult,
  StepContext,
  StepDefinition,
  StepExecutionResult,
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthStatus } from "./auth";
import { ConfigForm } from "./form";
import { ProgressVisualizer } from "./progress";

interface AutomationDashboardProps {
  serverSession: Session | null; // Passed from server component for initial render
}

export function AutomationDashboard({
  serverSession,
}: AutomationDashboardProps) {
  const { data: session, status } = useSession({
    required: true, // Ensures user is authenticated or redirects
  });

  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const appConfig = useAppSelector((state) => state.appConfig);
  const stepsStatusMap = useAppSelector((state) => state.setupSteps.steps);

  const isLoadingSession = status === "loading";
  // Use live session if available, otherwise fall back to server-provided session for initial load.
  const currentSession = session ?? serverSession;

  // Effect for initializing state from localStorage when the domain changes or on initial load.
  useEffect(() => {
    if (appConfig.domain) {
      const persisted = loadProgress(appConfig.domain);
      if (persisted) {
        dispatch(initializeSteps(persisted.steps));
        dispatch(addOutputs(persisted.outputs)); // Make sure outputs are initialized
        toast.info("Loaded saved progress for this domain.");
      } else {
        // If no persisted progress, ensure steps are initialized to pending
        const initialStatuses: Record<string, { status: "pending" }> = {};
        allStepDefinitions.forEach((def) => {
          initialStatuses[def.id] = { status: "pending" };
        });
        dispatch(initializeSteps(initialStatuses));
      }
    }
  }, [appConfig.domain, dispatch]);

  // Effect for persisting Redux state (steps and outputs) to localStorage.
  useEffect(() => {
    if (appConfig.domain) {
      saveProgress(appConfig.domain, {
        steps: stepsStatusMap,
        outputs: appConfig.outputs,
      });
    }
  }, [appConfig.domain, stepsStatusMap, appConfig.outputs]);

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

      const definition = allStepDefinitions.find((s) => s.id === stepId); // Corrected usage
      if (!definition) {
        toast.error(`Step definition '${stepId}' not found.`);
        dispatch(
          updateStep({
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

      // Ensure context has domain and tenantId, otherwise it's a programming error for `canRunAutomation` to be true
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
        outputs: store.getState().appConfig.outputs, // Get latest outputs
      };

      try {
        // Run pre-check if defined for the step
        if (stepActionImplementations.check) {
          const checkResult: StepCheckResult =
            await stepActionImplementations.check(context);
          if (checkResult.outputs) dispatch(addOutputs(checkResult.outputs));

          if (checkResult.completed) {
            dispatch(
              updateStep({
                id: stepId,
                status: "completed",
                message: checkResult.message || "Already completed.",
                metadata: { preExisting: true, ...(checkResult.outputs || {}) },
              })
            );
            toast.success(`${definition.title}: Checked - Already complete.`, {
              id: toastId,
            });
            return;
          }
        }

        // Execute the main action
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
          `${definition.title}: An unexpected error occurred during execution. ${message}`,
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
      // Corrected usage
      // Check current Redux state for the step
      const currentStepState = store.getState().setupSteps.steps[step.id];
      if (
        step.automatable &&
        (!currentStepState ||
          currentStepState.status === "pending" ||
          currentStepState.status === "failed")
      ) {
        await executeStep(step.id);
        // Re-fetch status after execution for accurate check
        if (store.getState().setupSteps.steps[step.id]?.status === "failed") {
          toast.error("Automation stopped due to a failed step.", {
            description: `Please review the error for step: ${step.title}`,
            duration: 10000,
          });
          anyStepFailed = true;
          break; // Stop processing further steps
        }
      }
    }
    if (!anyStepFailed) {
      toast.success("Automation sequence for pending steps complete.", {
        duration: 5000,
      });
    }
  }, [executeStep, store, canRunAutomation]);

  if (isLoadingSession) {
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

        {!canRunAutomation && (
          <Card className="border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/30">
            <CardHeader className="flex-row items-center gap-3 space-y-0 p-4">
              <AlertTriangleIcon className="h-6 w-6 shrink-0 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-sm text-orange-700 dark:text-orange-300">
              <p>
                Please complete all configuration fields above and connect to
                both Google and Microsoft accounts to enable the automation
                steps.
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
