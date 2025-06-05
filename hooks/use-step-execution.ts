import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './use-redux';
import { updateStep, clearCheckTimestamp } from '@/lib/redux/slices/setup-steps';
import { addOutputs } from '@/lib/redux/slices/app-config';
import { executeStepAction } from '@/app/actions/step-actions';
import type { StepId } from '@/lib/steps/step-refs';
import { ErrorManager } from '@/lib/error-handling/error-manager';
import { allStepDefinitions } from '@/lib/steps';
import { addApiLog } from '@/lib/redux/slices/debug-panel';

export function useStepExecution() {
  const dispatch = useAppDispatch();
  const appConfig = useAppSelector((state) => state.appConfig);

  const executeStep = useCallback(
    async (stepId: StepId) => {
      const definition = allStepDefinitions.find((s) => s.id === stepId);
      if (!definition) {
        ErrorManager.dispatch(new Error(`Step ${stepId} not found`), { stepId });
        return;
      }

      dispatch(clearCheckTimestamp(stepId));
      dispatch(
        updateStep({
          id: stepId,
          status: 'in_progress',
          error: null,
          message: undefined,
        })
      );

      try {
        const context = {
          domain: appConfig.domain!,
          tenantId: appConfig.tenantId!,
          outputs: appConfig.outputs,
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
              status: 'completed',
              message: result.message,
              metadata: {
                resourceUrl: result.resourceUrl,
                completedAt: new Date().toISOString(),
                ...(result.outputs || {}),
              },
              lastCheckedAt: new Date().toISOString(),
            })
          );
          console.log(`[useStepExecution] ${definition.title} succeeded`);
        } else {
          dispatch(
            updateStep({
              id: stepId,
              status: 'failed',
              error: result.error?.message,
              message: result.message,
              metadata: result.outputs || {},
              lastCheckedAt: new Date().toISOString(),
            })
          );

          if (result.outputs?.errorCode === 'AUTH_EXPIRED') {
            ErrorManager.dispatch(
              new Error(result.error?.message || 'Authentication expired'),
              { stepId, stepTitle: definition.title }
            );
          } else {
            console.error(
              `[useStepExecution] ${definition.title} failed:`,
              result.error?.message,
            );
          }
        }
      } catch (error) {
      dispatch(
        updateStep({
          id: stepId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          lastCheckedAt: new Date().toISOString(),
        })
      );

        ErrorManager.dispatch(error, { stepId, stepTitle: definition.title });
      }
    },
    [dispatch, appConfig]
  );

  return { executeStep };
}
