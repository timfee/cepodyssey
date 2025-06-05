import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkSuperAdmin } from "./check";
import { executeGrantSuperAdmin } from "./execute";

export const g3GrantSuperAdmin = defineStep({
  id: STEP_IDS.GRANT_SUPER_ADMIN,
  metadata: {
    title: "Grant Super Admin Privileges to Provisioning User",
    description: "Give the sync user admin permissions",
    category: "Google",
    activity: "Foundation",
    provider: "Google",
    automatability: "automated",
    requires: [STEP_IDS.CREATE_PROVISIONING_USER, STEP_IDS.VERIFY_DOMAIN],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
          description: "Email of the provisioning user",
          producedBy: STEP_IDS.CREATE_PROVISIONING_USER,
        },
        stepTitle: "Create Provisioning User",
      },
    ],
    outputs: [
      { key: OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID, description: "Role assignment ID for Super Admin" },
    ],
  },
  urls: {
    configure: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? portalUrls.google.users.details(outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string)
        : portalUrls.google.users.list(),
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? portalUrls.google.users.details(outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string)
        : portalUrls.google.users.list(),
  },
  handlers: { check: checkSuperAdmin, execute: executeGrantSuperAdmin },
});
