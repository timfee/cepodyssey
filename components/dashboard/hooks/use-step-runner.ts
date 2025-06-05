import { executeStepCheck } from "@/app/actions/step-actions";
import { useAutoCheck } from "@/hooks/use-auto-check";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { useSessionSync } from "@/hooks/use-session-sync";
import { useStepExecution } from "@/hooks/use-step-execution";
import { StepStatus } from "@/lib/constants/enums";
import { addOutputs, updateStep } from "@/lib/redux/slices/app-state";
import { setError } from "@/lib/redux/slices/ui-state";
import type { RootState } from "@/lib/redux/store";
import type { StepId } from "@/lib/steps/step-refs";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { useCallback, useMemo } from "react";
import { useStore } from "react-redux";

export function useStepRunner() {
  const { session, status } = useSessionSync();
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const domain = useAppSelector((state: RootState) => state.app.domain);
  const tenantId = useAppSelector((state: RootState) => state.app.tenantId);

  const currentSession = session;
  const canRunAutomation = useMemo(
    () =>
      !!(
        currentSession?.hasGoogleAuth &&
        currentSession?.hasMicrosoftAuth &&
        domain &&
        tenantId
      ),
    [
      currentSession?.hasGoogleAuth,
      currentSession?.hasMicrosoftAuth,
      domain,
      tenantId,
    ]
  );

  const { executeStep } = useStepExecution();

  const handleExecute = useCallback(
    async (stepId: StepId) => {
      if (!canRunAutomation) {
        dispatch(
          setError({
            message: "Please sign in to both Google and Microsoft to continue.",
          })
        );
        return;
      }
      await executeStep(stepId);
    },
    [executeStep, canRunAutomation, dispatch]
  );

  const executeCheck = useCallback(
    async (stepId: StepId): Promise<StepCheckResult> => {
      if (!domain || !tenantId) {
        return { completed: false } as StepCheckResult;
      }

      dispatch(
        updateStep({
          id: stepId,
          status: StepStatus.IN_PROGRESS,
          message: "Checking status...",
        })
      );

      const context: StepContext = {
        domain,
        tenantId,
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
              message:
                checkResult.message ||
                "Your session has expired. Please sign in again.",
            })
          );
          dispatch(
            updateStep({
              id: stepId,
              status: StepStatus.FAILED,
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
              status: StepStatus.FAILED,
              error: errorMessage,
              metadata: checkResult.outputs,
              lastCheckedAt: new Date().toISOString(),
            })
          );

          if (checkResult.outputs.errorCode === "API_NOT_ENABLED") {
            dispatch(
              setError({
                message: errorMessage,
                details: {
                  apiUrl: errorMessage.match(/https:\/\/[^\s]+/)?.[0],
                },
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
              status: StepStatus.COMPLETED,
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
              status: StepStatus.PENDING,
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
            status: StepStatus.FAILED,
            error: error instanceof Error ? error.message : "Check failed",
            lastCheckedAt: new Date().toISOString(),
          })
        );
        dispatch(
          setError({
            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred",
          })
        );
        return { completed: false } as StepCheckResult;
      }
    },
    [domain, tenantId, dispatch, store]
  );

  const { manualRefresh, isChecking } = useAutoCheck(executeCheck);

  const runAllPending = useCallback(async () => {
    if (!canRunAutomation) return;
    const { allStepDefinitions } = await import("@/lib/steps");
    let anyStepFailed = false;
    for (const step of allStepDefinitions) {
      const current = store.getState().app.steps[step.id];
      if (
        step.automatable &&
        (!current ||
          current.status === StepStatus.PENDING ||
          current.status === StepStatus.FAILED)
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
