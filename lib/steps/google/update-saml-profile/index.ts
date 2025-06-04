import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSamlProfileUpdate } from "./check";
import { executeUpdateSamlProfile } from "./execute";

export const g6UpdateSamlProfile: StepDefinition = {
  id: "G-6",
  title: "Update Google SAML Profile with Azure AD IdP Info",
  description: "Connect Google to Microsoft using sign-on details",
  details:
    "Updates the Google SAML profile with metadata from Azure AD including entity ID, SSO URL, and certificate. This completes the trust relationship for SSO.",

  category: "SSO",
  activity: "SSO",
  provider: "Google",

  automatability: "automated",
  automatable: true,
  requires: ["G-5", "M-8"],
  nextStep: { id: "G-7", description: "Assign the SAML profile" },

  actions: ["PATCH /v1/inboundSamlSsoProfiles/{profile}"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkSamlProfileUpdate,
  execute: executeUpdateSamlProfile,
};
