"use server";

import { APIError } from "@/lib/api/utils";
import * as google from "@/lib/api/google";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../utils/error-handling";

export async function checkAutomationOu(
  _context: StepContext
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
          resourceUrl: `https://admin.google.com/ac/orgunits?ouid=${orgUnit.orgUnitId}`,
        },
      };
    }

    return {
      completed: false,
      message: `Organizational Unit '/Automation' not found.`,
    };
  } catch (e) {
    if (e instanceof APIError && e.status === 404) {
      return {
        completed: false,
        message: `Organizational Unit '/Automation' not found.`,
      };
    }
    return handleCheckError(e, `Failed to check for OU '/Automation'.`);
  }
}
