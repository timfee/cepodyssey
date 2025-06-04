import type { StepDefinition } from "../../types";

/**
 * Step definition for updating the Google SAML profile with Azure AD metadata.
 */
export const g6UpdateSamlProfile: StepDefinition = {
  id: "G-6",
  title: "Update Google SAML Profile with Azure AD IdP Info",
  description:
    "Update the Google Workspace 'Azure AD SSO' SAML profile with the IdP metadata (Login URL, Entity ID, Certificate) retrieved from Azure AD (in step M-8) and enable the profile.",
  category: "SSO",
  automatable: true,
  requires: ["G-5", "M-8"],
  adminUrls: {
    configure: "https://admin.google.com/ac/sso",
    verify: "https://admin.google.com/ac/sso",
  },
};
