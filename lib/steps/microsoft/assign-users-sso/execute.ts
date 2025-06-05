import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { getRequiredOutput } from "../../utils/get-output";

export const executeAssignUsers = withExecutionHandling({
  stepId: STEP_IDS.ASSIGN_USERS_SSO,
  requiredOutputs: [
    OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    OUTPUT_KEYS.SAML_SSO_APP_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const spId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    );
    const appId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SAML_SSO_APP_ID,
    );
    return {
      success: true,
      message: "Assign users or groups to the SAML app in Azure Portal.",
      resourceUrl: portalUrls.azure.enterpriseApp.usersAndGroups(spId, appId),
    };
  },
});
