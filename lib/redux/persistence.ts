import type {
  AppConfigState,
  StepStatusInfo,
  StepDefinition,
} from "@/lib/types";

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
 * Saves the current setup progress to localStorage.
 * @param domain The primary domain, used as part of the localStorage key.
 * @param progress The progress data to save.
 */
export function saveProgress(
  domain: string,
  progress: PersistedProgress,
): void {
  if (typeof window === "undefined" || !domain) return;
  try {
    const key = getStorageKey(domain);
    localStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save progress to localStorage:", error);
  }
}

/**
 * Loads setup progress from localStorage.
 * @param domain The primary domain, used as part of the localStorage key.
 * @returns The persisted progress data, or null if not found.
 */
export async function loadProgress(domain: string): Promise<PersistedProgress | null> {
  if (typeof window === "undefined" || !domain) return null;
  try {
    const key = getStorageKey(domain);
    const savedData = localStorage.getItem(key);
    if (!savedData) return null;
    const parsed = JSON.parse(savedData) as PersistedProgress;

    // Import step definitions to check which steps are checkable
    const { allStepDefinitions } = await import("@/lib/steps");

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
    console.error("Failed to load or parse progress from localStorage:", error);
    return null;
  }
}
