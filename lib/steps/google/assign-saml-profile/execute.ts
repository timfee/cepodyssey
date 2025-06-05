import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeAssignSamlProfile = withExecutionHandling({
  stepId: STEP_IDS.ASSIGN_SAML_PROFILE,
  requiredOutputs: [OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();
    const profileFullName = context.outputs[
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME
    ] as string;

    await google.assignSamlToOrgUnits(
      token,
      profileFullName,
      [{ orgUnitId: "/", ssoMode: "SAML_SSO_ENABLED" }],
      context.logger,
    );

    return {
      success: true,
      message:
        "SAML profile assigned to Root OU for all users. Specific assignments can be adjusted in Google Admin console.",
      resourceUrl: portalUrls.google.sso.main(),
    };
  },
});
