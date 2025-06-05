import * as microsoft from "@/lib/api/microsoft";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getTokens } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";

export const executeRetrieveIdpMetadata = withExecutionHandling({
  stepId: STEP_IDS.RETRIEVE_IDP_METADATA,
  requiredOutputs: [
    OUTPUT_KEYS.SAML_SSO_APP_ID,
    OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const { tenantId } = await getTokens();
    const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
    const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
    const { certificate, ssoUrl, entityId } = await microsoft.getSamlMetadata(
      tenantId,
      appId,
      context.logger,
    );

    return {
      success: true,
      message: "Retrieved IdP metadata from Microsoft.",
      outputs: {
        [OUTPUT_KEYS.IDP_CERTIFICATE_BASE64]: certificate,
        [OUTPUT_KEYS.IDP_SSO_URL]: ssoUrl,
        [OUTPUT_KEYS.IDP_ENTITY_ID]: entityId,
      },
      resourceUrl: portalUrls.azure.enterpriseApp.singleSignOn(spId, appId),
    };
  },
});
