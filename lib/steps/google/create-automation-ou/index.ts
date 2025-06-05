import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAutomationOu } from "./check";
import { executeCreateAutomationOu } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const G1_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.AUTOMATION_OU_ID,
    description: "Unique identifier for the organizational unit",
  },
  {
    key: OUTPUT_KEYS.AUTOMATION_OU_PATH,
    description: "Full path to the organizational unit",
  },
];

export const G1_INPUTS: StepInput[] = [];

export const g1CreateAutomationOu: StepDefinition = {
  id: STEP_IDS.CREATE_AUTOMATION_OU,
  title: "Create 'Automation' Organizational Unit",
  description: "Create a dedicated folder for automation users and service accounts",
  details:
    "Creates an organizational unit at the root level of your Google Workspace directory. This OU will contain service accounts and other automation-related users, keeping them separate from regular users for security and organization.",

  category: "Google",
  activity: "Foundation",
  provider: "Google",

  automatability: "automated",
  automatable: true,

  inputs: G1_INPUTS,
  outputs: G1_OUTPUTS,
  requires: [STEP_IDS.VERIFY_DOMAIN],
  nextStep: {
    id: STEP_IDS.CREATE_PROVISIONING_USER,
    description: "Create a dedicated provisioning user in the Automation OU",
  },

  actions: [
    "OAuth 2.0 flow initiation",
    "POST /admin/directory/v1/customer/{customerId}/orgunits",
  ],
  adminUrls: {
    configure: portalUrls.google.orgUnits.list(),
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH]
        ? portalUrls.google.orgUnits.details(
            outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string,
          )
        : portalUrls.google.orgUnits.list(),
  },
  check: checkAutomationOu,
  execute: executeCreateAutomationOu,
};
