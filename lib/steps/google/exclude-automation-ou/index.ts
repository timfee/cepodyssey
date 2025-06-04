import type { StepDefinition } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkExcludeAutomationOu } from "./check";
import { executeExcludeAutomationOu } from "./execute";

export const g8ExcludeAutomationOu: StepDefinition = {
  id: "G-8",
  title: "Exclude Automation OU from SSO (Optional)",
  description: "Keep sync user using Google sign-in (optional)",
  details:
    "Optionally excludes the Automation organizational unit from the assigned SAML profile so service accounts continue to use Google sign-in instead of SSO.",

  category: "SSO",
  activity: "SSO",
  provider: "Google",

  automatability: "supervised",
  automatable: true,
  requires: ["G-7"],
  nextStep: undefined,

  actions: ["PATCH /v1/inboundSamlSsoProfiles/{profile}:unassignFromOrgUnits"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkExcludeAutomationOu,
  execute: executeExcludeAutomationOu,
};
