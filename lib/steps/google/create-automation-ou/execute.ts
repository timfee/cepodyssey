"use server";

import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Create the 'Automation' Organizational Unit in Google Workspace.
 */
export async function executeCreateAutomationOu(
  _context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const ouName = "Automation";
    const parentPath = "/";

    const result = await google.createOrgUnit(token, ouName, parentPath);

    if (typeof result === "object" && "alreadyExists" in result) {
      const existing = await google.getOrgUnit(token, `${parentPath}${ouName}`);
      if (existing?.orgUnitId && existing.orgUnitPath) {
        return {
          success: true,
          message: `Organizational Unit '${ouName}' already exists.`,
          outputs: {
            [OUTPUT_KEYS.AUTOMATION_OU_ID]: existing.orgUnitId,
            [OUTPUT_KEYS.AUTOMATION_OU_PATH]: existing.orgUnitPath,
          },
          resourceUrl: portalUrls.google.orgUnits.details(existing.orgUnitPath),
        };
      }
      return {
        success: true,
        message: `Organizational Unit '${ouName}' already exists.`,
      };
    }

    if (!result.orgUnitId || !result.orgUnitPath) {
      return {
        success: false,
        error: { message: "Failed to create OU.", code: "API_ERROR" },
      };
    }

    return {
      success: true,
      message: `Organizational Unit '${ouName}' created successfully.`,
      outputs: {
        [OUTPUT_KEYS.AUTOMATION_OU_ID]: result.orgUnitId,
        [OUTPUT_KEYS.AUTOMATION_OU_PATH]: result.orgUnitPath,
      },
      resourceUrl: portalUrls.google.orgUnits.details(result.orgUnitPath),
    };
  } catch (e) {
    return handleExecutionError(e, "G-1");
  }
}
