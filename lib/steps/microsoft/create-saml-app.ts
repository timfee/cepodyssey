import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { getAzurePortalUrl } from "../../utils";
/**
 * Step definition for creating the Azure AD enterprise app used for SAML SSO.
 */

export const m6CreateSamlApp: StepDefinition = {
  id: "M-6",
  title: "Create Azure AD Enterprise App for SAML SSO",
  description:
    "Adds a second instance of the 'Google Cloud / G Suite Connector by Microsoft' gallery app (or a non-gallery app configured for SAML) in Azure AD. This instance will be dedicated to SAML Single Sign-On.",
  category: "SSO",
  automatable: true,
  requires: [],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("Overview", spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("Overview", spId as string, appId as string);
    },
  },
};
