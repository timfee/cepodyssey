import {
  getUser,
  listRoleAssignments,
  assignAdminRole,
} from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../../utils/auth";
import { STEP_IDS } from "@/lib/steps/step-refs";
import { withExecutionHandling } from "../../utils/execute-wrapper";
import { validateRequiredOutputs } from "../../utils/validation";
import { getRequiredOutput } from "../../utils/get-output";

export const executeGrantSuperAdmin = withExecutionHandling({
  stepId: STEP_IDS.GRANT_SUPER_ADMIN,

  requiredOutputs: [
    OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
    OUTPUT_KEYS.GOOGLE_CUSTOMER_ID,
  ],
  executeLogic: async (context: StepContext): Promise<StepExecutionResult> => {
    const token = await getGoogleToken();

    const validation = validateRequiredOutputs(context, [
      OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
      OUTPUT_KEYS.GOOGLE_CUSTOMER_ID,
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const email = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
    );
    const customerId = getRequiredOutput<string>(
      context,
      OUTPUT_KEYS.GOOGLE_CUSTOMER_ID,
    );
    if (!email) {
      return {
        success: false,
        error: {
          message: "Provisioning user email missing.",
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    if (!customerId) {
      return {
        success: false,
        error: { message: "Customer ID not found in previous step." },
      };
    }
    const user = await getUser(token, email);

    if (user?.isAdmin) {
      return {
        success: true,
        message: `User '${email}' is already an admin.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    const roles = await listRoleAssignments(
      token,
      email,
      context.logger,
    );
    if (roles.some((r) => r.roleId === "3")) {
      return {
        success: true,
        message: `User '${email}' already has Super Admin role.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }

    await assignAdminRole(token, email, "3", customerId, context.logger);

    return {
      success: true,
      message: `Super Admin role assigned to '${email}'.`,
      outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
      resourceUrl: portalUrls.google.users.details(email),
    };
  },
});
