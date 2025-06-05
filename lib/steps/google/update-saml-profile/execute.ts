import { googleApi } from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { getRequiredOutput } from "../../utils/get-output";

export const executeUpdateSamlProfile = withExecutionHandling({
  stepId: STEP_IDS.UPDATE_SAML_PROFILE,
  requiredOutputs: [
    OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    OUTPUT_KEYS.IDP_SSO_URL,
    OUTPUT_KEYS.IDP_ENTITY_ID,
    OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const profileName = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    );
    const idpSsoUrl = getRequiredOutput<string>(context, OUTPUT_KEYS.IDP_SSO_URL);
    const idpEntityId = getRequiredOutput<string>(context, OUTPUT_KEYS.IDP_ENTITY_ID);
    const cert = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
    );

    await googleApi.saml.updateProfile(
      profileName,
      {
        idpConfig: {
          entityId: idpEntityId,
          singleSignOnServiceUri: idpSsoUrl,
        },
      },
      context.logger,
    );

    await googleApi.saml.addIdpCredentials(
      profileName,
      cert,
      context.logger,
    );

    return {
      success: true,
      message: "Google SAML profile updated with Microsoft IdP info.",
      resourceUrl: portalUrls.google.sso.samlProfile(profileName),
    };
  },
});
