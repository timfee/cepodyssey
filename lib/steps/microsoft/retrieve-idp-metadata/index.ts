import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { getOutputValue } from "../../utils/get-output";
import { checkIdpMetadata } from "./check";
import { executeRetrieveIdpMetadata } from "./execute";

export const m8RetrieveIdpMetadata = defineStep({
  id: STEP_IDS.RETRIEVE_IDP_METADATA,
  metadata: {
    title: "Retrieve Azure AD IdP SAML Metadata for Google",
    description: "Get Microsoft's sign-on details for Google",
    category: "Microsoft",
    activity: "SSO",
    provider: "Microsoft",
    automatability: Automatability.AUTOMATED,
    requires: [STEP_IDS.CONFIGURE_SAML_APP],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
          description: "SAML SP object ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_ID,
          description: "SAML app ID",
          producedBy: STEP_IDS.CREATE_SAML_APP,
        },
        stepTitle: "Create SAML App",
      },
    ],
    outputs: [
      { key: OUTPUT_KEYS.IDP_CERTIFICATE_BASE64, description: "IdP certificate" },
      { key: OUTPUT_KEYS.IDP_SSO_URL, description: "IdP SSO URL" },
      { key: OUTPUT_KEYS.IDP_ENTITY_ID, description: "IdP entity ID" },
    ],
  },
  urls: {
    configure: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(spId, appId);
    },
    verify: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.SAML_SSO_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.singleSignOn(spId, appId);
    },
  },
  handlers: { check: checkIdpMetadata, execute: executeRetrieveIdpMetadata },
});
