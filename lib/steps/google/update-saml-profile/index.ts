import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkSamlProfileUpdate } from "./check";
import { executeUpdateSamlProfile } from "./execute";

export const g6UpdateSamlProfile = defineStep({
  id: STEP_IDS.UPDATE_SAML_PROFILE,
  metadata: {
    title: "Update Google SAML Profile with Azure AD IdP Info",
    description: "Connect Google to Microsoft using sign-on details",
    category: "SSO",
    activity: "SSO",
    provider: "Google",
    automatability: Automatability.AUTOMATED,
    requires: [STEP_IDS.INITIATE_SAML_PROFILE, STEP_IDS.RETRIEVE_IDP_METADATA],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
          description: "Full name of the Google SAML profile",
          producedBy: STEP_IDS.INITIATE_SAML_PROFILE,
        },
        stepTitle: "Initiate Google SAML Profile",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.IDP_ENTITY_ID,
          description: "Azure AD Entity ID",
          producedBy: STEP_IDS.RETRIEVE_IDP_METADATA,
        },
        stepTitle: "Retrieve Azure AD IdP Metadata",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.IDP_SSO_URL,
          description: "Azure AD SSO URL",
          producedBy: STEP_IDS.RETRIEVE_IDP_METADATA,
        },
        stepTitle: "Retrieve Azure AD IdP Metadata",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
          description: "Azure AD signing certificate",
          producedBy: STEP_IDS.RETRIEVE_IDP_METADATA,
        },
        stepTitle: "Retrieve Azure AD IdP Metadata",
      },
    ],
    outputs: [],
  },
  urls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  handlers: { check: checkSamlProfileUpdate, execute: executeUpdateSamlProfile },
});
