import { executeStepAction } from "@/app/actions/step-actions";
import { ErrorManager } from "@/lib/error-handling/error-manager";
import { addOutputs } from "@/lib/redux/slices/app-config";
import { addApiLog } from "@/lib/redux/slices/debug-panel";
import {
  clearCheckTimestamp,
  updateStep,
} from "@/lib/redux/slices/setup-steps";
import { allStepDefinitions } from "@/lib/steps";
import type { StepId } from "@/lib/steps/step-refs";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./use-redux";

export function useStepExecution() {
  const dispatch = useAppDispatch();
  const domain = useAppSelector((state) => state.appConfig.domain);
  const tenantId = useAppSelector((state) => state.appConfig.tenantId);
  const outputs = useAppSelector((state) => state.appConfig.outputs);

  const executeStep = useCallback(
    async (stepId: StepId) => {
      const definition = allStepDefinitions.find((s) => s.id === stepId);
      if (!definition) {
        ErrorManager.dispatch(new Error(`Step ${stepId} not found`), {
          stepId,
        });
        return;
      }

      dispatch(clearCheckTimestamp(stepId));
      dispatch(
        updateStep({
          id: stepId,
          status: "in_progress",
          error: null,
          message: undefined,
        }),
      );

      try {
        const context = {
          domain: domain!,
          tenantId: tenantId!,
          outputs,
        };

        const result = await executeStepAction(stepId, context);

        if (result.apiLogs && result.apiLogs.length > 0) {
          result.apiLogs.forEach((log) => {
            dispatch(addApiLog(log));
          });
        }

        if (result.outputs) {
          dispatch(addOutputs(result.outputs));
        }

        if (result.success) {
          dispatch(
            updateStep({
              id: stepId,
              status: "completed",
              completionType: "server-verified",
              message: result.message,
              metadata: {
                resourceUrl: result.resourceUrl,
                completedAt: new Date().toISOString(),
                ...(result.outputs || {}),
              },
              lastCheckedAt: new Date().toISOString(),
            }),
          );
        } else {
          const errorMessage =
            result.error?.message ||
            "An unknown error occurred during execution.";
          dispatch(
            updateStep({
              id: stepId,
              status: "failed",
              error: errorMessage,
              message: result.message,
              metadata: result.outputs || {},
              lastCheckedAt: new Date().toISOString(),
            }),
          );
          ErrorManager.dispatch(new Error(errorMessage), {
            stepId,
            stepTitle: definition.title,
            ...result.outputs,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        dispatch(
          updateStep({
            id: stepId,
            status: "failed",
            error: errorMessage,
            lastCheckedAt: new Date().toISOString(),
          }),
        );
        ErrorManager.dispatch(error, {
          stepId,
          stepTitle: definition.title,
        });
      }
    },
    [dispatch, domain, tenantId, outputs],
  );

  return { executeStep };
}
