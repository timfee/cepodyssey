import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSamlProfile } from "./check";
import { executeInitiateSamlProfile } from "./execute";

export const g5InitiateSamlProfile: StepDefinition = {
  id: "G-5",
  title: "Initiate Google SAML Profile & Get SP Details",
  description: "Set up single sign-on profile and get connection details",
  details:
    "Creates a new SAML SSO profile in Google Workspace and captures the Service Provider (SP) entity ID and ACS URL used by Microsoft Entra ID.",

  category: "Google",
  activity: "SSO",
  provider: "Google",

  automatability: "automated",
  automatable: true,
  requires: ["G-4"],
  nextStep: { id: "G-6", description: "Update the SAML profile with IdP info" },

  actions: ["POST /v1/inboundSamlSsoProfiles"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkSamlProfile,
  execute: executeInitiateSamlProfile,
};
