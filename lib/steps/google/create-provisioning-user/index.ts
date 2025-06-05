import type { StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkProvisioningUser } from "./check";
import { executeCreateProvisioningUser } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "../../utils/step-factory";

export const G2_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.AUTOMATION_OU_PATH,
      description: "Path to the Automation organizational unit",
      producedBy: STEP_IDS.CREATE_AUTOMATION_OU,
    },
    stepTitle: "Create 'Automation' Organizational Unit",
  },
];

export const g2CreateProvisioningUser = defineStep({
  id: STEP_IDS.CREATE_PROVISIONING_USER,
  metadata: {
    title: "Create Provisioning User in 'Automation' OU",
    description: "Create a sync user for Microsoft to connect with",
    details:
      "Creates a service account user (azuread-provisioning@domain) within the Automation OU. This account will be used by Azure AD to authenticate and sync users to Google Workspace via OAuth.",
    category: "Google",
    activity: "Foundation",
    provider: "Google",
  },
  io: {
    inputs: G2_INPUTS,
    outputs: [
      { key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL, description: "Email address of the provisioning user" },
      { key: OUTPUT_KEYS.SERVICE_ACCOUNT_ID, description: "Unique identifier for the provisioning user" },
    ] as StepOutput[],
  },
  requires: [STEP_IDS.CREATE_AUTOMATION_OU],
  nextStep: {
    id: STEP_IDS.GRANT_SUPER_ADMIN,
    description: "Grant admin privileges to the provisioning user",
  },
  actions: ["POST /admin/directory/v1/users"],
  urls: {
    configure: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? portalUrls.google.users.details(
            outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string,
          )
        : portalUrls.google.users.list(),
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? portalUrls.google.users.details(
            outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string,
          )
        : portalUrls.google.users.list(),
  },
  handlers: { check: checkProvisioningUser, execute: executeCreateProvisioningUser },
});
