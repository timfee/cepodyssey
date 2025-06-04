"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkG3ProvisioningUserIsAdmin } from "@/app/actions/check-actions";
import { OUTPUT_KEYS } from "@/lib/types";

export async function checkSuperAdmin(context: StepContext): Promise<StepCheckResult> {
  const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
  if (!email) {
    return { completed: false, message: "Provisioning user not found." };
  }
  return checkG3ProvisioningUserIsAdmin(email);
}
