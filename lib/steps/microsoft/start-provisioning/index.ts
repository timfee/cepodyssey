import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { Automatability } from "@/lib/constants/enums";
import { OUTPUT_KEYS } from "@/lib/types";
import { getOutputValue } from "../../utils/get-output";
import { checkStartProvisioning } from "./check";
import { executeStartProvisioning } from "./execute";

export const m5StartProvisioning = defineStep({
  id: STEP_IDS.START_PROVISIONING,
  metadata: {
    title: "Define Scope & Start Provisioning Job",
    description: "Start syncing users (configure who to sync first)",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
    automatability: Automatability.SUPERVISED,
    requires: [STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS],
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
    outputs: [],
  },
  urls: {
    configure: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.PROVISIONING_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(spId, appId);
    },
    verify: (outputs) => {
      const spId = getOutputValue<string>(outputs, OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID);
      const appId = getOutputValue<string>(outputs, OUTPUT_KEYS.PROVISIONING_APP_ID);
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(spId, appId);
    },
  },
  handlers: { check: checkStartProvisioning, execute: executeStartProvisioning },
});
