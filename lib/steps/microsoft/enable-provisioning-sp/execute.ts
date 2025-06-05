import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeEnableProvisioningSp = withExecutionHandling({
  stepId: STEP_IDS.ENABLE_PROVISIONING_SP,
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_APP_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const { microsoftToken } = await getTokens();
    const spId = context.outputs[
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID
    ] as string;
    const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;

    await microsoft.patchServicePrincipal(microsoftToken, spId, {
      accountEnabled: true,
    });

    return {
      success: true,
      message: "Provisioning app service principal enabled.",
      outputs: { [OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.overview(spId, appId),
    };
  },
});
