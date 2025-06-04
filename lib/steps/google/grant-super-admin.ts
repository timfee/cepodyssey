import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { portalUrls } from "@/lib/api/url-builder";
/**
 * Step definition for granting super admin privileges to the provisioning user.
 */

export const g3GrantSuperAdmin: StepDefinition = {
  id: "G-3",
  title: "Grant Super Admin Privileges to Provisioning User",
  description:
    "Assigns Super Admin role to the provisioning user so Azure can manage users and groups.",
  category: "Google",
  automatable: true,
  requires: ["G-2"],
  adminUrls: {
    configure: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? portalUrls.google.users.details(outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string)
        : portalUrls.google.users.list(),
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? portalUrls.google.users.details(outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string)
        : portalUrls.google.users.list(),
  },
};
