import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkAttributeMappings } from "./check";
import { executeConfigureAttributeMappings } from "./execute";

export const m4ConfigureAttributeMappings = defineStep({
  id: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
  metadata: {
    title: "Configure Attribute Mappings (Provisioning)",
    description: "Set up how user data syncs between systems",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
    automatability: "manual",
    requires: [STEP_IDS.AUTHORIZE_PROVISIONING],
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
          key: OUTPUT_KEYS.PROVISIONING_JOB_ID,
          description: "Provisioning job ID",
          producedBy: STEP_IDS.AUTHORIZE_PROVISIONING,
        },
        stepTitle: "Authorize Provisioning",
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
      { key: OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED, description: "Attribute mappings configured" },
    ],
  },
  urls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(spId as string, appId as string);
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(spId as string, appId as string);
    },
  },
  handlers: { check: checkAttributeMappings, execute: executeConfigureAttributeMappings },
});
