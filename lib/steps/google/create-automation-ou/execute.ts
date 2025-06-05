"use server";

import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../../utils/error-handling";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { validateRequiredOutputs } from "../../utils/validation";

/**
 * Create the 'Automation' Organizational Unit in Google Workspace.
 */
export async function executeCreateAutomationOu(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const validation = validateRequiredOutputs(
      context,
      [OUTPUT_KEYS.GWS_CUSTOMER_ID],
      STEP_IDS.VERIFY_DOMAIN,
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const ouName = "Automation";
    const parentPath = "/";
    const customerId = context.outputs[OUTPUT_KEYS.GWS_CUSTOMER_ID] as string;

    const result = await google.createOrgUnit(token, ouName, parentPath, customerId);

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
    return handleExecutionError(e, STEP_IDS.CREATE_AUTOMATION_OU);
  }
}
