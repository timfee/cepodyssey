import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { defineStep } from "@/lib/steps/utils/step-factory";
import { OUTPUT_KEYS } from "@/lib/types";
import { checkAutomationOu } from "./check";
import { executeCreateAutomationOu } from "./execute";

export const g1CreateAutomationOu = defineStep({
  id: STEP_IDS.CREATE_AUTOMATION_OU,
  metadata: {
    title: "Create 'Automation' Organizational Unit",
    description: "Create a dedicated folder for automation users",
    category: "Google",
    activity: "Foundation",
    provider: "Google",
    automatability: "automated",
    requires: [STEP_IDS.VERIFY_DOMAIN],
  },
  io: {
    inputs: [],
    outputs: [
      { key: OUTPUT_KEYS.AUTOMATION_OU_ID, description: "Unique identifier for the organizational unit" },
      { key: OUTPUT_KEYS.AUTOMATION_OU_PATH, description: "Full path to the organizational unit" },
    ],
  },
  urls: {
    configure: portalUrls.google.orgUnits.list(),
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH]
        ? portalUrls.google.orgUnits.details(outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string)
        : portalUrls.google.orgUnits.list(),
  },
  handlers: { check: checkAutomationOu, execute: executeCreateAutomationOu },
});
