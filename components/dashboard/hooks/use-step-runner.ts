import { useCallback, useMemo } from "react";
import { useStore } from "react-redux";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useStepExecution } from "@/hooks/use-step-execution";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { executeStepCheck } from "@/app/actions/step-actions";
import { useAutoCheck } from "@/hooks/use-auto-check";
import { addOutputs, updateStep } from "@/lib/redux/slices/app-state";
import { setError } from "@/lib/redux/slices/ui-state";
import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions } from "@/lib/steps";
import type { StepId } from "@/lib/steps/step-refs";
import type { StepCheckResult, StepContext } from "@/lib/types";

export function useStepRunner() {
  const { session, status } = useSessionSync();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const appConfig = useAppSelector((state: RootState) => state.app);

  const currentSession = session;
  const canRunAutomation = useMemo(
    () =>
      !!(
        currentSession?.hasGoogleAuth &&
        currentSession?.hasMicrosoftAuth &&
        appConfig.domain &&
        appConfig.tenantId
      ),
    [currentSession?.hasGoogleAuth, currentSession?.hasMicrosoftAuth, appConfig.domain, appConfig.tenantId]
  );

  const { executeStep } = useStepExecution();

  const handleExecute = useCallback(
    async (stepId: StepId) => {
      if (!canRunAutomation) {
        dispatch(
          setError({ message: "Please sign in to both Google and Microsoft to continue." })
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

      dispatch(
        updateStep({ id: stepId, status: "in_progress", message: "Checking status..." })
      );

      const context: StepContext = {
        domain: appConfig.domain,
        tenantId: appConfig.tenantId,
        outputs: store.getState().app.outputs,
      };

      try {
        const checkResult = await executeStepCheck(stepId, context);

        if (checkResult.outputs) {
          dispatch(addOutputs(checkResult.outputs));
        }

        if (checkResult.outputs?.errorCode === "AUTH_EXPIRED") {
          dispatch(
            setError({
              message: checkResult.message || "Your session has expired. Please sign in again.",
            })
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
            })
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
            })
          );

          if (checkResult.outputs.errorCode === "API_NOT_ENABLED") {
            dispatch(
              setError({
                message: errorMessage,
                details: { apiUrl: errorMessage.match(/https:\/\/[^\s]+/)?.[0] },
              })
            );
          } else {
            dispatch(setError({ message: `Check Failed: ${errorMessage}` }));
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
            })
          );
        } else {
          dispatch(
            updateStep({
              id: stepId,
              status: "pending",
              message: checkResult.message || "Not completed",
              error: null,
              metadata: checkResult.outputs || {},
            })
          );
        }
        return checkResult;
      } catch (error) {
        dispatch(
          updateStep({
            id: stepId,
            status: "failed",
            error: error instanceof Error ? error.message : "Check failed",
            lastCheckedAt: new Date().toISOString(),
          })
        );
        dispatch(
          setError({
            message: error instanceof Error ? error.message : "An unexpected error occurred",
          })
        );
        return { completed: false } as StepCheckResult;
      }
    },
    [appConfig.domain, appConfig.tenantId, dispatch, store]
  );

  const { manualRefresh, isChecking } = useAutoCheck(executeCheck);

  const runAllPending = useCallback(async () => {
    if (!canRunAutomation) return;
    let anyStepFailed = false;
    for (const step of allStepDefinitions) {
      const current = store.getState().app.steps[step.id];
      if (
        step.automatable &&
        (!current || current.status === "pending" || current.status === "failed")
      ) {
        await handleExecute(step.id as StepId);
        if (store.getState().app.steps[step.id]?.status === "failed") {
          anyStepFailed = true;
          break;
        }
      }
    }
    if (!anyStepFailed) {
      console.log("All steps completed");
    }
  }, [handleExecute, store, canRunAutomation]);

  return {
    canRunAutomation,
    handleExecute,
    executeCheck,
    manualRefresh,
    isChecking,
    runAllPending,
    session,
    status,
  };
}
