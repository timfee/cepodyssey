import type { StepDefinition } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
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
    configure: "https://admin.google.com/ac/orgunits",
    verify: (outputs) =>
      outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH]
        ? `https://admin.google.com/ac/orgunits/details?ouPath=${outputs[OUTPUT_KEYS.AUTOMATION_OU_PATH] as string}`
        : "https://admin.google.com/ac/orgunits",
  },
  check: checkAutomationOu,
  execute: executeCreateAutomationOu,
};
