"use server";
import * as google from "@/lib/api/google";
import type { StepContext, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import { portalUrls } from "@/lib/api/url-builder";
import { getGoogleToken } from "../utils/auth";
import { handleExecutionError } from "../utils/error-handling";

/**
 * Grant the Super Admin role to the provisioning user.
 */
export async function executeGrantSuperAdmin(
  context: StepContext,
): Promise<StepExecutionResult> {
  try {
    const token = await getGoogleToken();
    const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
    if (!email) {
      return {
        success: false,
        error: {
          message: "Provisioning user email missing.",
          code: "MISSING_DEPENDENCY",
        },
      };
    }
    const user = await google.getUser(token, email);
    if (user?.isAdmin) {
      return {
        success: true,
        message: `User '${email}' is already an admin.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    const roles = await google.listRoleAssignments(token, email);
    if (roles.some((r) => r.roleId === "3")) {
      return {
        success: true,
        message: `User '${email}' already has Super Admin role.`,
        outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
        resourceUrl: portalUrls.google.users.details(email),
      };
    }
    await google.assignAdminRole(token, email, "3");
    return {
      success: true,
      message: `Super Admin role assigned to '${email}'.`,
      outputs: { [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3" },
      resourceUrl: portalUrls.google.users.details(email),
    };
  } catch (e) {
    return handleExecutionError(e, "G-3");
  }
}
