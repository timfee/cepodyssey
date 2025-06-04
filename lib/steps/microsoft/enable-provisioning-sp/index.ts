import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkEnableProvisioningSp } from "./check";
import { executeEnableProvisioningSp } from "./execute";

export const m2EnableProvisioningSp: StepDefinition = {
  id: "M-2",
  title: "Enable Provisioning App Service Principal",
  description: "Enable the sync app",
  details:
    "Enables the service principal created by the gallery app so that it can accept credentials and configuration settings.",

  category: "Microsoft",
  activity: "Provisioning",
  provider: "Microsoft",

  automatability: "automated",
  automatable: true,

  requires: ["M-1"],
  nextStep: {
    id: "M-3",
    description: "Authorize provisioning using Google admin",
  },
  actions: ["PATCH /servicePrincipals/{id}"],
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
