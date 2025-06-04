"use server";
import type { StepCheckResult, StepContext } from "@/lib/types";
import { checkDomainVerified } from "@/app/actions/check-actions";

export async function checkDomain(context: StepContext): Promise<StepCheckResult> {
  if (!context.domain) {
    return { completed: false, message: "Domain not configured." };
  }
  return checkDomainVerified(context.domain);
}
