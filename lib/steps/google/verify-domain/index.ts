import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { checkDomain } from "./check";
import { executeVerifyDomain } from "./execute";

export const G4_OUTPUTS: StepOutput[] = [];
export const G4_INPUTS: StepInput[] = [];

export const g4VerifyDomain: StepDefinition = {
  id: STEP_IDS.VERIFY_DOMAIN,
  title: "Add & Verify Domain for Federation",
  description: "Verify your domain is ready for single sign-on",
  details:
    "Adds your primary domain to Google Workspace and verifies ownership via DNS. This step ensures that federation and provisioning operate on a verified domain.",

  category: "Google",
  activity: "Foundation",
  provider: "Google",

  automatability: "supervised",
  automatable: true,

  inputs: G4_INPUTS,
  outputs: G4_OUTPUTS,
  requires: [],
  nextStep: {
    id: STEP_IDS.INITIATE_SAML_PROFILE,
    description: "Create the SAML SSO profile",
  },

  actions: ["POST /admin/directory/v1/customer/{customerId}/domains"],
  adminUrls: {
    configure: portalUrls.google.domains.manage(),
    verify: portalUrls.google.domains.manage(),
  },
  check: checkDomain,
  execute: executeVerifyDomain,
};
