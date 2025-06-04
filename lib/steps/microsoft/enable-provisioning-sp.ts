import type { StepDefinition } from "../../types";
import { OUTPUT_KEYS } from "../../types";
import { getAzurePortalUrl } from "../../utils";
/**
 * Step definition for enabling the Azure AD provisioning service principal.
 */

export const m2EnableProvisioningSp: StepDefinition = {
  id: "M-2",
  title: "Enable Provisioning App Service Principal",
  description:
    "Ensures the Service Principal associated with the Azure AD provisioning application is enabled, allowing it to operate.",
  category: "Microsoft",
  automatable: true,
  requires: ["M-1"],
  adminUrls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("Overview", spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return getAzurePortalUrl("Overview", spId as string, appId as string);
    },
  },
};
