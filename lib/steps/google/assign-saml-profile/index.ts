import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAssignSamlProfile } from "./check";
import { executeAssignSamlProfile } from "./execute";

export const g7AssignSamlProfile: StepDefinition = {
  id: "G-7",
  title: "Assign Google SAML Profile to Users/OUs",
  description: "Turn on single sign-on for your users",
  details:
    "Assigns the created SAML profile to your Organizational Units or user groups so that sign-in requests are redirected to Microsoft. This enables SSO for selected users.",

  category: "SSO",
  activity: "SSO",
  provider: "Google",

  automatability: "automated",
  automatable: true,
  requires: ["G-6"],
  nextStep: { id: "G-8", description: "Exclude Automation OU from SSO" },

  actions: ["POST /v1/inboundSamlSsoProfiles/{profile}:assignToOrgUnits"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkAssignSamlProfile,
  execute: executeAssignSamlProfile,
};
