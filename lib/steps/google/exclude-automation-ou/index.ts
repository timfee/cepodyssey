import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkExcludeAutomationOu } from "./check";
import { executeExcludeAutomationOu } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const G8_OUTPUTS: StepOutput[] = [];
export const G8_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
      description: "Full name of the Google SAML profile",
      producedBy: STEP_IDS.INITIATE_SAML_PROFILE,
    },
    stepTitle: "Initiate Google SAML Profile",
  },
];

export const g8ExcludeAutomationOu: StepDefinition = {
  id: STEP_IDS.EXCLUDE_AUTOMATION_OU,
  title: "Exclude Automation OU from SSO (Optional)",
  description: "Keep sync user using Google sign-in (optional)",
  details:
    "Optionally excludes the Automation organizational unit from the assigned SAML profile so service accounts continue to use Google sign-in instead of SSO.",

  category: "SSO",
  activity: "SSO",
  provider: "Google",

  automatability: "supervised",
  automatable: true,
  inputs: G8_INPUTS,
  outputs: G8_OUTPUTS,
  requires: [STEP_IDS.ASSIGN_SAML_PROFILE],
  nextStep: undefined,

  actions: ["PATCH /v1/inboundSamlSsoProfiles/{profile}:unassignFromOrgUnits"],
  adminUrls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  check: checkExcludeAutomationOu,
  execute: executeExcludeAutomationOu,
};
