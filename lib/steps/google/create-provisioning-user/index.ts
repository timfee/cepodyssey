import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkProvisioningUser } from "./check";
import { executeCreateProvisioningUser } from "./execute";

export const g2CreateProvisioningUser = defineStep({
  id: STEP_IDS.CREATE_PROVISIONING_USER,
  metadata: {
    title: "Create Provisioning User in 'Automation' OU",
    description: "Create a sync user for Microsoft to connect with",
    category: "Google",
    activity: "Foundation",
    provider: "Google",
    automatability: Automatability.AUTOMATED,
    requires: [STEP_IDS.CREATE_AUTOMATION_OU],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.AUTOMATION_OU_PATH,
          description: "Path to the Automation organizational unit",
          producedBy: STEP_IDS.CREATE_AUTOMATION_OU,
        },
        stepTitle: "Create 'Automation' Organizational Unit",
      },
    ],
    outputs: [
      { key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL, description: "Email address of the provisioning user" },
      { key: OUTPUT_KEYS.SERVICE_ACCOUNT_ID, description: "Unique identifier for the provisioning user" },
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
  handlers: { check: checkProvisioningUser, execute: executeCreateProvisioningUser },
});
