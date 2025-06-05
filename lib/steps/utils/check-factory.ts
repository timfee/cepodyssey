import type { StepCheckResult, StepContext } from "@/lib/types";

interface CreateCheckOptions {
  requiredOutputs: string[];
  checkLogic: (context: StepContext) => Promise<StepCheckResult>;
}

export function createStepCheck({
  requiredOutputs,
  checkLogic,
}: CreateCheckOptions) {
  return async function (context: StepContext): Promise<StepCheckResult> {
    const missing = requiredOutputs.filter(
      (key) => !Object.prototype.hasOwnProperty.call(context.outputs, key),
    );
    if (missing.length > 0) {
      return {
        completed: false,
        message: `This step is blocked. Required outputs are missing: ${missing.join(", ")}.`,
      };
    }
    return await checkLogic(context);
  };
}
