import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { portalUrls } from "@/lib/api/url-builder";
/**
 * Step definition for creating the Azure AD provisioning user in Google Workspace.
 */

export const g2CreateProvisioningUser: StepDefinition = {
  id: "G-2",
  title: "Create Provisioning User in 'Automation' OU",
  description:
    "Creates the dedicated user 'azuread-provisioning' inside the Automation OU for Azure provisioning.",
  category: "Google",
  automatable: true,
  requires: ["G-1"],
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
