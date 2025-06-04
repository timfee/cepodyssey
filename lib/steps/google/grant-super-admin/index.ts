import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkSuperAdmin } from "./check";
import { executeGrantSuperAdmin } from "./execute";

export const g3GrantSuperAdmin: StepDefinition = {
  id: "G-3",
  title: "Grant Super Admin Privileges to Provisioning User",
  description: "Give the sync user admin permissions",
  category: "Google",
  automatable: true,
  requires: ["G-2"],
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
