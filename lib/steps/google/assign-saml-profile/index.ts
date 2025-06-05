import type { StepInput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAssignSamlProfile } from "./check";
import { executeAssignSamlProfile } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "../../utils/step-factory";

export const G7_INPUTS: StepInput[] = [
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

export const g7AssignSamlProfile = defineStep({
  id: STEP_IDS.ASSIGN_SAML_PROFILE,
  metadata: {
    title: "Assign Google SAML Profile to Users/OUs",
    description: "Turn on single sign-on for your users",
    details:
      "Assigns the created SAML profile to your Organizational Units or user groups so that sign-in requests are redirected to Microsoft. This enables SSO for selected users.",
    category: "SSO",
    activity: "SSO",
    provider: "Google",
  },
  io: {
    inputs: G7_INPUTS,
    outputs: [],
  },
  requires: [STEP_IDS.UPDATE_SAML_PROFILE],
  nextStep: {
    id: STEP_IDS.EXCLUDE_AUTOMATION_OU,
    description: "Exclude Automation OU from SSO",
  },

  actions: ["POST /v1/inboundSamlSsoProfiles/{profile}:assignToOrgUnits"],
  urls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  handlers: { check: checkAssignSamlProfile, execute: executeAssignSamlProfile },
});
