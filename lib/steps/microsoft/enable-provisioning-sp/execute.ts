import { microsoftApi } from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { getRequiredOutput } from "../../utils/get-output";
import { getTokens } from "../../utils/auth";

export const executeEnableProvisioningSp = withExecutionHandling({
  stepId: STEP_IDS.ENABLE_PROVISIONING_SP,
  requiredOutputs: [
    OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    OUTPUT_KEYS.PROVISIONING_APP_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
    );
    const appId = getRequiredOutput<string>(context, OUTPUT_KEYS.PROVISIONING_APP_ID);

    await microsoftApi.servicePrincipals.update(
      spId,
      { accountEnabled: true },
      context.logger,
    );

    return {
      success: true,
      message: "Provisioning app service principal enabled.",
      outputs: { [OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.overview(spId, appId),
    };
  },
});
