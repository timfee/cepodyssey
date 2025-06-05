import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import type { StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkSamlProfile } from "./check";
import { executeInitiateSamlProfile } from "./execute";
import { defineStep } from "../../utils/step-factory";

export const G5_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME,
    description: "SAML profile name",
  },
  {
    key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
    description: "Full resource name of the SAML profile",
  },
  {
    key: OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
    description: "Google SP Entity ID",
  },
  { key: OUTPUT_KEYS.GOOGLE_SAML_SP_ACS_URL, description: "Google ACS URL" },
];

export const G5_INPUTS: StepInput[] = [];

export const g5InitiateSamlProfile = defineStep({
  id: STEP_IDS.INITIATE_SAML_PROFILE,
  metadata: {
    title: "Initiate Google SAML Profile & Get SP Details",
    description: "Set up single sign-on profile and get connection details",
    details:
      "Creates a new SAML SSO profile in Google Workspace and captures the Service Provider (SP) entity ID and ACS URL used by Microsoft Entra ID.",
    category: "Google",
    activity: "SSO",
    provider: "Google",
  },
  io: {
    inputs: G5_INPUTS,
    outputs: G5_OUTPUTS,
  },
  requires: [STEP_IDS.VERIFY_DOMAIN],
  nextStep: {
    id: STEP_IDS.UPDATE_SAML_PROFILE,
    description: "Update the SAML profile with IdP info",
  },
  actions: ["POST /v1/inboundSamlSsoProfiles"],
  urls: {
    configure: portalUrls.google.sso.main(),
    verify: portalUrls.google.sso.main(),
  },
  handlers: { check: checkSamlProfile, execute: executeInitiateSamlProfile },
});
