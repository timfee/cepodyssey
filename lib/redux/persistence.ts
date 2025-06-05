import type {
  AppConfigState,
  StepStatusInfo,
  StepDefinition,
} from "@/lib/types";
import { secureStorage } from "@/lib/storage";

export interface PersistedProgress {
  steps: Record<string, StepStatusInfo>;
  outputs: AppConfigState["outputs"];
}

const getStorageKey = (domain: string) => `automation-progress-${domain}`;

function migrateStepStatus(input: StepStatusInfo | string): StepStatusInfo {
  if (typeof input === "string") {
    return { status: input as StepStatusInfo["status"] };
  }
  return input as StepStatusInfo;
}

/**
 * Saves the current setup progress using SecureStorage.
 * @param domain The primary domain, used as part of the storage key.
 * @param progress The progress data to save.
 */
export async function saveProgress(
  domain: string,
  progress: PersistedProgress,
): Promise<void> {
  if (typeof window === "undefined" || !domain) return;
  const key = getStorageKey(domain);
  await secureStorage.save(key, progress);
}

/**
 * Loads setup progress from SecureStorage.
 * @param domain The primary domain, used as part of the storage key.
 * @returns The persisted progress data, or null if not found.
 */
export async function loadProgress(domain: string): Promise<PersistedProgress | null> {
  if (typeof window === "undefined" || !domain) return null;
  try {
    const key = getStorageKey(domain);
    const savedData = await secureStorage.load<PersistedProgress>(key);
    if (!savedData) return null;
    const parsed = savedData as PersistedProgress;

    // Import step definitions to check which steps are checkable
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { allStepDefinitions } = require("@/lib/steps");

    // Filter out checkable steps from persisted state
    const filteredSteps: Record<string, StepStatusInfo> = {};
    Object.keys(parsed.steps).forEach((stepId) => {
      const stepDef = allStepDefinitions.find(
        (def: StepDefinition) => def.id === stepId,
      );
      // Only keep status for steps without a check function (non-checkable/manual steps)
      if (stepDef && !stepDef.check) {
        filteredSteps[stepId] = migrateStepStatus(parsed.steps[stepId]);
      }
    });

    return {
      steps: filteredSteps,
      outputs: parsed.outputs || {},
    };
  } catch (error) {
    console.error("Failed to load or parse progress from storage:", error);
    return null;
  }
}
