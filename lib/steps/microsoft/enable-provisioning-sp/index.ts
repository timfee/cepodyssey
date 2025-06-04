import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkEnableProvisioningSp } from "./check";
import { executeEnableProvisioningSp } from "./execute";

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
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(
        spId as string,
        appId as string,
      );
    },
  },
  check: checkEnableProvisioningSp,
  execute: executeEnableProvisioningSp,
};
