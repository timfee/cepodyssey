import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkProvisioningUser } from "./check";
import { executeCreateProvisioningUser } from "./execute";

export const g2CreateProvisioningUser: StepDefinition = {
  id: "G-2",
  title: "Create Provisioning User in 'Automation' OU",
  description: "Create a sync user for Microsoft to connect with",
  details:
    "Creates a service account user (azuread-provisioning@domain) within the Automation OU. This account will be used by Azure AD to authenticate and sync users to Google Workspace via OAuth.",

  category: "Google",
  activity: "Foundation",
  provider: "Google",

  automatability: "automated",
  automatable: true,

  requires: ["G-1"],
  nextStep: {
    id: "G-3",
    description: "Grant admin privileges to the provisioning user",
  },

  actions: ["POST /admin/directory/v1/users"],
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
  check: checkProvisioningUser,
  execute: executeCreateProvisioningUser,
};
