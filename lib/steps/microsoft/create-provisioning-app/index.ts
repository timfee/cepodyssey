import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkProvisioningApp } from "./check";
import { executeCreateProvisioningApp } from "./execute";

export const m1CreateProvisioningApp = defineStep({
  id: STEP_IDS.CREATE_PROVISIONING_APP,
  metadata: {
    title: "Create Azure AD Enterprise App for Provisioning",
    description: "Add Google sync app from Microsoft's gallery",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
    automatability: Automatability.AUTOMATED,
  },
  io: {
    inputs: [],
    outputs: [
      { key: OUTPUT_KEYS.PROVISIONING_APP_ID, description: "App (Client) ID" },
      { key: OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID, description: "Application Object ID" },
      { key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID, description: "Service Principal Object ID" },
    ],
  },
  urls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.overview(spId as string, appId as string);
    },
  },
  handlers: { check: checkProvisioningApp, execute: executeCreateProvisioningApp },
});
