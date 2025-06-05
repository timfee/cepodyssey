import type { StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAuthorizeProvisioning } from "./check";
import { executeAuthorizeProvisioning } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "../../utils/step-factory";

export const M3_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED,
    description: "Provisioning connection authorized",
  },
  { key: OUTPUT_KEYS.PROVISIONING_JOB_ID, description: "Provisioning job ID" },
];

export const M3_INPUTS: StepInput[] = [
  {
    type: "keyValue",
    data: {
      key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
      description: "Service principal object ID",
      producedBy: STEP_IDS.CREATE_PROVISIONING_APP,
    },
    stepTitle: "Create Provisioning App",
  },
];

export const m3AuthorizeProvisioning = defineStep({
  id: STEP_IDS.AUTHORIZE_PROVISIONING,
  metadata: {
    title: "Authorize Azure AD Provisioning to Google Workspace",
    description:
      "Connect Microsoft to Google: Click 'Authorize' in Azure and sign in with the Google sync user",
    details:
      "Manually complete the OAuth consent flow in the Azure portal using the provisioning user. This grants Azure AD permission to manage users and groups in Google Workspace.",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
    automatability: "manual",
  },
  io: {
    inputs: M3_INPUTS,
    outputs: M3_OUTPUTS,
  },
  requires: [STEP_IDS.ENABLE_PROVISIONING_SP, STEP_IDS.GRANT_SUPER_ADMIN],
  nextStep: {
    id: STEP_IDS.CONFIGURE_ATTRIBUTE_MAPPINGS,
    description: "Configure how user attributes map between systems",
  },

  actions: [
    "Manual: Click 'Authorize' in Azure portal",
    "Manual: Sign in with provisioning user",
    "Manual: Grant consent",
    "Manual: Test connection",
  ],
  urls: {
    configure: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(
        spId as string,
        appId as string,
      );
    },
    verify: (outputs) => {
      const spId = outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID];
      const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID];
      if (!spId || !appId) return null;
      return portalUrls.azure.enterpriseApp.provisioning(
        spId as string,
        appId as string,
      );
    },
  },
  handlers: { check: checkAuthorizeProvisioning, execute: executeAuthorizeProvisioning },
});
