"use server";

import { APIError } from "@/lib/api/utils";
import * as google from "@/lib/api/google";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../../utils/error-handling";
import { getStepInputs, getStepOutputs } from "@/lib/steps/registry";
import { STEP_IDS } from "@/lib/steps/step-refs";

/**
 * Confirm the 'Automation' Organizational Unit exists in Google Workspace.
 */
export async function checkAutomationOu(
  _context: StepContext,
): Promise<StepCheckResult> {
  try {
    const token = await getGoogleToken();
    const orgUnit = await google.getOrgUnit(token, "/Automation");

    if (orgUnit?.orgUnitId && orgUnit.orgUnitPath) {
      return {
        completed: true,
        message: `Organizational Unit '/Automation' found.`,
        outputs: {
          [OUTPUT_KEYS.AUTOMATION_OU_ID]: orgUnit.orgUnitId,
          [OUTPUT_KEYS.AUTOMATION_OU_PATH]: orgUnit.orgUnitPath,
          resourceUrl: portalUrls.google.orgUnits.details(orgUnit.orgUnitPath),
          producedOutputs: getStepOutputs(STEP_IDS.CREATE_AUTOMATION_OU).map((o) => ({
            ...o,
            value:
              o.key === OUTPUT_KEYS.AUTOMATION_OU_ID
                ? orgUnit.orgUnitId
                : orgUnit.orgUnitPath,
          })),
        },
      };
    }

    return {
      completed: false,
      message: `Organizational Unit '/Automation' not found.`,
      outputs: {
        inputs: getStepInputs(STEP_IDS.CREATE_AUTOMATION_OU),
        expectedOutputs: getStepOutputs(STEP_IDS.CREATE_AUTOMATION_OU),
      },
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Organizational Unit '/Automation' not found.`,
        outputs: {
          inputs: getStepInputs(STEP_IDS.CREATE_AUTOMATION_OU),
          expectedOutputs: getStepOutputs(STEP_IDS.CREATE_AUTOMATION_OU),
        },
      };
    }
    return handleCheckError(e, `Couldn't verify for OU '/Automation'.`);
  }
}
