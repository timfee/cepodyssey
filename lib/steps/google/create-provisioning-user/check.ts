"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkG2ProvisioningUserExists } from "@/app/actions/check-actions";

export async function checkProvisioningUser(context: StepContext): Promise<StepCheckResult> {
  if (!context.domain) {
    return { completed: false, message: "Domain not configured." };
  }
  return checkG2ProvisioningUserExists(context.domain);
}
