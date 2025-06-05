import type { StepDefinition, StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSuperAdmin } from "./check";
import { executeGrantSuperAdmin } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";

export const G3_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID,
    description: "Role assignment ID for Super Admin",
  },
];

export const G3_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
      description: "Email of the provisioning user",
      producedBy: STEP_IDS.CREATE_PROVISIONING_USER,
    },
    stepTitle: "Create Provisioning User",
  },
];

export const g3GrantSuperAdmin: StepDefinition = {
  id: STEP_IDS.GRANT_SUPER_ADMIN,
  title: "Grant Super Admin Privileges to Provisioning User",
  description: "Give the sync user admin permissions",
  details:
    "Assigns Super Admin role to the provisioning user, granting full access to manage users, groups, and organizational units. This is required for Azure AD to perform provisioning operations.",

  category: "Google",
  activity: "Foundation",
  provider: "Google",

  automatability: "automated",
  automatable: true,

  inputs: G3_INPUTS,
  outputs: G3_OUTPUTS,
  requires: [STEP_IDS.CREATE_PROVISIONING_USER, STEP_IDS.VERIFY_DOMAIN],
  nextStep: { id: STEP_IDS.VERIFY_DOMAIN, description: "Verify your domain for federation" },

  actions: ["POST /admin/directory/v1/customer/{customerId}/roleassignments"],
  adminUrls: {
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
  check: checkSuperAdmin,
  execute: executeGrantSuperAdmin,
};
