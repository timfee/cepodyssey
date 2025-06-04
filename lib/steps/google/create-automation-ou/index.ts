import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { checkAutomationOu } from "./check";
import { executeCreateAutomationOu } from "./execute";

export const g1CreateAutomationOu: StepDefinition = {
  id: "G-1",
  title: "Create 'Automation' Organizational Unit",
  description:
    "Creates a dedicated Organizational Unit named 'Automation' to house the provisioning user.",
  category: "Google",
  automatable: true,
  requires: [],
  adminUrls: {
    configure: portalUrls.google.orgUnits.list(),
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH]
        ? portalUrls.google.orgUnits.details(
            outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string,
          )
        : portalUrls.google.orgUnits.list(),
  },
  check: checkAutomationOu,
  execute: executeCreateAutomationOu,
};
