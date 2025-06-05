import type { StepCheckResult, StepContext } from '@/lib/types';
import { getStepInputs, getStepOutputs } from '@/lib/steps/registry';
import { type StepId } from '@/lib/steps/step-refs';

interface CreateCheckOptions {
  stepId: StepId;
  requiredOutputs: string[];
  checkLogic: (context: StepContext) => Promise<StepCheckResult>;
}

/**
 * A factory that creates a standardized `check` function for a step,
 * handling boilerplate for input validation and result formatting.
 */
export function createStepCheck({
  stepId,
  requiredOutputs,
  checkLogic,
}: CreateCheckOptions) {
  return async function (context: StepContext): Promise<StepCheckResult> {
    const missing = requiredOutputs.filter((key) => !context.outputs[key]);
    if (missing.length > 0) {
      return {
        completed: false,
        message: `This step is blocked. Required outputs are missing: ${missing.join(
          ', ',
        )}.`,
        outputs: {
          inputs: getStepInputs(stepId),
          expectedOutputs: getStepOutputs(stepId),
        },
      };
    }

    const result = await checkLogic(context);

    // Automatically enrich the successful result with standard input/output metadata
    if (result.completed) {
      return {
        ...result,
        outputs: {
          ...(result.outputs || {}),
          producedOutputs: getStepOutputs(stepId).map((o) => ({
            ...o,
            value: result.outputs
              ? result.outputs[o.key as keyof typeof result.outputs]
              : undefined,
          })),
          inputs: getStepInputs(stepId).map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      };
    }

    // For failures, enrich with standard inputs/outputs for the UI
    return {
        ...result,
        outputs: {
             ...(result.outputs || {}),
            inputs: getStepInputs(stepId),
            expectedOutputs: getStepOutputs(stepId),
        }
    };
  };
}
