"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";
import * as google from "@/lib/api/google";
import { getGoogleToken } from "../utils/auth";
import { handleCheckError } from "../utils/error-handling";
import { getStepInputs, getStepOutputs } from "@/lib/steps/utils/io-mapping";

/**
 * Verify the provisioning user has Super Admin privileges.
 */
export async function checkSuperAdmin(
  context: StepContext,
): Promise<StepCheckResult> {
  const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
  if (!email) {
    return {
      completed: false,
      message: "Provisioning user not found.",
      outputs: {
        inputs: getStepInputs("G-3"),
        expectedOutputs: getStepOutputs("G-3"),
      },
    };
  }

  try {
    const token = await getGoogleToken();
    const user = await google.getUser(token, email);
    if (!user) {
      return {
        completed: false,
        message: `Service account '${email}' not found.`,
        outputs: {
          inputs: getStepInputs("G-3"),
          expectedOutputs: getStepOutputs("G-3"),
        },
      };
    }
    if (user.isAdmin === true && user.suspended === false) {
      return {
        completed: true,
        message: `Service account '${email}' has admin privileges.`,
        outputs: {
          producedOutputs: getStepOutputs("G-3").map((o) => ({
            ...o,
            value: o.key === OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID ? "3" : undefined,
          })),
          inputs: getStepInputs("G-3").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      };
    }
    const roles = await google.listRoleAssignments(token, email);
    const hasSuperAdmin = roles.some((r) => r.roleId === "3");
    if (hasSuperAdmin) {
      return {
        completed: true,
        message: `Service account has Super Admin role assigned.`,
        outputs: {
          [OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID]: "3",
          producedOutputs: getStepOutputs("G-3").map((o) => ({
            ...o,
            value: o.key === OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID ? "3" : undefined,
          })),
          inputs: getStepInputs("G-3").map((inp) => ({
            ...inp,
            data: { ...inp.data, value: context.outputs[inp.data.key!] },
          })),
        },
      };
    }
    return {
      completed: false,
      message: `Service account exists but lacks admin privileges.`,
      outputs: {
        inputs: getStepInputs("G-3"),
        expectedOutputs: getStepOutputs("G-3"),
      },
    };
  } catch (e) {
    return handleCheckError(e, `Couldn't verify admin status.`);
  }
}
