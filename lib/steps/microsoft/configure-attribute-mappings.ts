import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { getAzurePortalUrl } from "../../utils";
/**
 * Step definition for configuring attribute mappings in the provisioning app.
 */

export const m4ConfigureAttributeMappings: StepDefinition = {
  id: "M-4",
  title: "Configure Attribute Mappings (Provisioning)",
  description:
    "Define attribute mappings for user sync from Azure AD to Google Workspace in the provisioning app (e.g., UPN to primaryEmail). This tool applies a common default set.",
  category: "Microsoft",
  automatable: true,
  requires: ["M-3"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("ProvisioningManagement", spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("ProvisioningManagement", spId as string, appId as string);
    },
  },
};
