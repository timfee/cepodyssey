import { microsoftApi } from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { getRequiredOutput } from "../../utils/get-output";
import { getTokens } from "../../utils/auth";

export const executeStartProvisioning = withExecutionHandling({
  stepId: STEP_IDS.START_PROVISIONING,
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_JOB_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    );
    const jobId = getRequiredOutput<string>(context, OUTPUT_KEYS.PROVISIONING_JOB_ID);

    await microsoftApi.provisioning.startJob(spId, jobId, context.logger);

    return {
      success: true,
      message: "Provisioning job started.",
      resourceUrl: portalUrls.azure.enterpriseApp.provisioning(spId, jobId),
    };
  },
});
