import { microsoftApi, type Application } from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { getRequiredOutput } from "../../utils/get-output";

export const executeConfigureSamlApp = withExecutionHandling({
  stepId: STEP_IDS.CONFIGURE_SAML_APP,
  requiredOutputs: [
    OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
    OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    OUTPUT_KEYS.SAML_SSO_APP_ID,
    OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
    OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {

    const { microsoftToken } = await getTokens();
    const appObjectId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
    );
    const spObjectId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
    );
    const appId = getRequiredOutput<string>(context, OUTPUT_KEYS.SAML_SSO_APP_ID);
    const googleSpEntityId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
    );
    const googleAcsUrl = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL,
    );
    const primaryDomain = context.domain;

    const appPatchPayload: Partial<Application> = {
      identifierUris: [googleSpEntityId, `https://${primaryDomain}`],
      web: {
        redirectUris: [googleAcsUrl],
        implicitGrantSettings: {
          enableIdTokenIssuance: false,
          enableAccessTokenIssuance: false,
        },
      },
    };

    await microsoftApi.applications.update(
      appObjectId,
      appPatchPayload,
      context.logger,
    );

    return {
      success: true,
      message:
        "Azure AD SAML app (Identifier URIs, Reply URL) configured. Verify \`User Attributes & Claims\` (NameID should be UPN) manually in Azure Portal.",
      outputs: { [OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED]: true },
      resourceUrl: portalUrls.azure.enterpriseApp.singleSignOn(
        spObjectId,
        appId,
      ),
    };
  },
});
