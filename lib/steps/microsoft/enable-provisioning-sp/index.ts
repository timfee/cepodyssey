import type { StepInput, StepOutput } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkEnableProvisioningSp } from "./check";
import { executeEnableProvisioningSp } from "./execute";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "../../utils/step-factory";

export const M2_OUTPUTS: StepOutput[] = [
  {
    key: OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED,
    description: "Provisioning app enabled",
  },
];

export const M2_INPUTS: StepInput[] = [
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
];

export const m2EnableProvisioningSp = defineStep({
  id: STEP_IDS.ENABLE_PROVISIONING_SP,
  metadata: {
    title: "Enable Provisioning App Service Principal",
    description: "Enable the sync app",
    details:
      "Enables the service principal created by the gallery app so that it can accept credentials and configuration settings.",
    category: "Microsoft",
    activity: "Provisioning",
    provider: "Microsoft",
  },
  io: {
    inputs: M2_INPUTS,
    outputs: M2_OUTPUTS,
  },
  requires: [STEP_IDS.CREATE_PROVISIONING_APP],
  nextStep: {
    id: STEP_IDS.AUTHORIZE_PROVISIONING,
    description: "Authorize provisioning using Google admin",
  },
  actions: ["PATCH /servicePrincipals/{id}"],
  urls: {
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
  handlers: { check: checkEnableProvisioningSp, execute: executeEnableProvisioningSp },
});
