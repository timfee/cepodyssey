import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkAuthorizeProvisioning } from "./check";
import { executeAuthorizeProvisioning } from "./execute";

export const m3AuthorizeProvisioning = defineStep({
  id: STEP_IDS.AUTHORIZE_PROVISIONING,
  metadata: {
    title: "Authorize Azure AD Provisioning to Google Workspace",
    description: "Connect Microsoft to Google: Click 'Authorize' in Azure and sign in with the Google sync user",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
    automatability: "manual",
    requires: [STEP_IDS.ENABLE_PROVISIONING_SP, STEP_IDS.GRANT_SUPER_ADMIN],
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
    ],
    outputs: [
      { key: OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED, description: "Provisioning connection authorized" },
      { key: OUTPUT_KEYS.PROVISIONING_JOB_ID, description: "Provisioning job ID" },
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
  handlers: { check: checkAuthorizeProvisioning, execute: executeAuthorizeProvisioning },
});
