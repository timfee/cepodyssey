import type { StepStatusInfo } from "@/lib/types";

export function migrateStepStatus(oldStatus: StepStatusInfo): StepStatusInfo {
  if (oldStatus.status === "completed") {
    return {
      ...oldStatus,
      completionType: oldStatus.metadata?.preExisting ? "server-verified" : "user-marked",
    };
  }
  return oldStatus;
}
