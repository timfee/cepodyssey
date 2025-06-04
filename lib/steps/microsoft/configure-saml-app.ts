import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
/**
 * Step definition for configuring the Azure AD SAML application with Google details.
 */

export const m7ConfigureSamlApp: StepDefinition = {
  id: "M-7",
  title: "Configure Azure AD SAML App for Google",
  description:
    "In the Azure AD SAML app, configure Basic SAML Settings (Identifier (Entity ID) & Reply URL (ACS URL) from Google - obtained in G-5) and ensure User Attributes & Claims are mapped correctly (e.g., NameID to UPN).",
  category: "SSO",
  automatable: true,
  requires: ["M-6", "G-5"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`;
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.SAML_SSO_APP_ID];
      if (!spId || !appId) return null;
      return `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/${appId}/objectId/${spId}`;
    },
  },
};
