import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './use-redux';
import { updateStep } from '@/lib/redux/slices/setup-steps';
import { addOutputs } from '@/lib/redux/slices/app-config';
import { executeStepAction } from '@/app/actions/step-actions';
import { ErrorManager } from '@/lib/error-handling/error-manager';
import { allStepDefinitions } from '@/lib/steps';
import { toast } from 'sonner';

export function useStepExecution() {
  const dispatch = useAppDispatch();
  const appConfig = useAppSelector((state) => state.appConfig);

  const executeStep = useCallback(
    async (stepId: string) => {
      const definition = allStepDefinitions.find((s) => s.id === stepId);
      if (!definition) {
        ErrorManager.dispatch(new Error(`Step ${stepId} not found`), { stepId });
        return;
      }

      dispatch(
        updateStep({
          id: stepId,
          status: 'in_progress',
          error: null,
          message: undefined,
        })
      );

      const toastId = toast.loading(`Executing: ${definition.title}...`);

      try {
        const context = {
          domain: appConfig.domain!,
          tenantId: appConfig.tenantId!,
          outputs: appConfig.outputs,
        };

        const result = await executeStepAction(stepId, context);

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
            })
          );
          toast.success(`${definition.title}: Success!`, { id: toastId });
        } else {
          dispatch(
            updateStep({
              id: stepId,
              status: 'failed',
              error: result.error?.message,
              message: result.message,
              metadata: result.outputs || {},
            })
          );

          if (result.outputs?.errorCode === 'AUTH_EXPIRED') {
            ErrorManager.dispatch(
              new Error(result.error?.message || 'Authentication expired'),
              { stepId, stepTitle: definition.title }
            );
          } else {
            toast.error(`${definition.title}: ${result.error?.message}`, { id: toastId });
          }
        }
      } catch (error) {
        toast.dismiss(toastId);
        dispatch(
          updateStep({
            id: stepId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        );

        ErrorManager.dispatch(error, { stepId, stepTitle: definition.title });
      }
    },
    [dispatch, appConfig]
  );

  return { executeStep };
}
