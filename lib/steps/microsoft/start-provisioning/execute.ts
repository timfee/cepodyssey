import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeStartProvisioning = withExecutionHandling({
  stepId: STEP_IDS.START_PROVISIONING,
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_JOB_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const { microsoftToken } = await getTokens();
    const spId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;

    await microsoft.startProvisioningJob(
      microsoftToken,
      spId,
      jobId,
      context.logger,
    );

    return {
      success: true,
      message: "Provisioning job started.",
      resourceUrl: portalUrls.azure.enterpriseApp.provisioning(spId, jobId),
    };
  },
});
