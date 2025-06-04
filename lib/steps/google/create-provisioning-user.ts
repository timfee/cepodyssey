import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
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
        ? `https://admin.google.com/ac/users/${outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string}`
        : "https://admin.google.com/ac/users",
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL]
        ? `https://admin.google.com/ac/users/${outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string}`
        : "https://admin.google.com/ac/users",
  },
};
