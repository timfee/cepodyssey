import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { AlreadyExistsError } from "@/lib/api/errors";
import { getGoogleToken } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { validateRequiredOutputs } from "../../utils/validation";
import { getRequiredOutput } from "../../utils/get-output";

export const executeCreateAutomationOu = withExecutionHandling({
  stepId: STEP_IDS.CREATE_AUTOMATION_OU,
  requiredOutputs: [OUTPUT_KEYS.GOOGLE_CUSTOMER_ID],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();

    const validation = validateRequiredOutputs(
      context,
      [OUTPUT_KEYS.GOOGLE_CUSTOMER_ID],
      STEP_IDS.VERIFY_DOMAIN,
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const ouName = "Automation";
    const parentPath = "/";
    const customerId = (
      getRequiredOutput<{ customerId?: string }>(context, STEP_IDS.VERIFY_DOMAIN)
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

    let created: google.GoogleOrgUnit;
    try {
      created = await google.createOrgUnit(
        token,
        ouName,
        parentPath,
        customerId,
        context.logger,
      );
    } catch (error) {
      if (error instanceof AlreadyExistsError) {
        const existing = await google.getOrgUnit(
          token,
          `${parentPath}${ouName}`,
          context.logger,
        );
        if (existing?.orgUnitId && existing.orgUnitPath) {
          return {
            success: true,
            message: `Organizational Unit '${ouName}' already exists.`,
            outputs: {
              [OUTPUT_KEYS.AUTOMATION_OU_ID]: existing.orgUnitId,
              [OUTPUT_KEYS.AUTOMATION_OU_PATH]: existing.orgUnitPath,
            },
            resourceUrl: portalUrls.google.orgUnits.details(
              existing.orgUnitPath,
            ),
          };
        }
        return {
          success: true,
          message: `Organizational Unit '${ouName}' already exists.`,
        };
      }
      throw error;
    }

    if (!created.orgUnitId || !created.orgUnitPath) {
      return {
        success: false,
        error: { message: "Failed to create OU.", code: "API_ERROR" },
      };
    }

    return {
      success: true,
      message: `Organizational Unit '${ouName}' created successfully.`,
      outputs: {
        [OUTPUT_KEYS.AUTOMATION_OU_ID]: created.orgUnitId,
        [OUTPUT_KEYS.AUTOMATION_OU_PATH]: created.orgUnitPath,
      },
      resourceUrl: portalUrls.google.orgUnits.details(created.orgUnitPath),
    };
  },
});
