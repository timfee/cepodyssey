import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkEnableProvisioningSp } from "./check";
import { executeEnableProvisioningSp } from "./execute";

export const m2EnableProvisioningSp = defineStep({
  id: STEP_IDS.ENABLE_PROVISIONING_SP,
  metadata: {
    title: "Enable Provisioning App Service Principal",
    description: "Enable the sync app",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
    automatability: "automated",
    requires: [STEP_IDS.CREATE_PROVISIONING_APP],
  },
  io: {
    inputs: [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
          description: "Service principal object ID",
          producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
        },
        stepTitle: "Create Provisioning App",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_APP_ID,
          description: "Provisioning app ID",
          producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
        },
        stepTitle: "Create Provisioning App",
      },
    ],
    outputs: [
      { key: OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED, description: "Provisioning app enabled" },
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
  handlers: { check: checkEnableProvisioningSp, execute: executeEnableProvisioningSp },
});
