import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkProvisioningApp } from "./check";
import { executeCreateProvisioningApp } from "./execute";

export const m1CreateProvisioningApp: StepDefinition = {
  id: "M-1",
  title: "Create Azure AD Enterprise App for Provisioning",
  description: "Add Google sync app from Microsoft's gallery",
  category: "Microsoft",
  automatable: true,
  requires: [],
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
  check: checkProvisioningApp,
  execute: executeCreateProvisioningApp,
};
