"use server";

import * as google from "@/lib/api/google";
import { portalUrls } from "@/lib/api/url-builder";
import { STEP_IDS } from "@/lib/steps/step-refs";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { handleExecutionError } from "../../utils/error-handling";
import { validateRequiredOutputs } from "../../utils/validation";
import { getGoogleToken } from "../utils/auth";

/**
 * Create the 'Automation' Organizational Unit in Google Workspace.
 */
export async function executeCreateAutomationOu(
  context: StepContext
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const validation = validateRequiredOutputs(
      context,
      [OUTPUT_KEYS.GOOGLE_CUSTOMER_ID],
      STEP_IDS.VERIFY_DOMAIN
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const ouName = "Automation";
    const parentPath = "/";
    const customerId = (
      context.outputs[STEP_IDS.VERIFY_DOMAIN] as { customerId?: string }
    )?.customerId;
    if (!customerId) {
      return {
        success: false,
        error: {
          message:
            "Customer ID not found. Please ensure the domain verification step (G-4) has been completed successfully.",
          code: "MISSING_DEPENDENCY",
        },
      };
    }

    const result = await google.createOrgUnit(
      token,
      ouName,
      parentPath,
      customerId,
      context.logger
    );

    if (typeof result === "object" && "alreadyExists" in result) {
      const existing = await google.getOrgUnit(
        token,
        `${parentPath}${ouName}`,
        context.logger
      );
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
