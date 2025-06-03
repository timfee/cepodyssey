import type { AppConfigState, StepStatusInfo } from "@/lib/types";

export interface PersistedProgress {
  steps: Record<string, StepStatusInfo>;
  outputs: AppConfigState["outputs"];
}

const getStorageKey = (domain: string) => `automation-progress-${domain}`;

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
export function loadProgress(domain: string): PersistedProgress | null {
  if (typeof window === "undefined" || !domain) return null;
  try {
    const key = getStorageKey(domain);
    const savedData = localStorage.getItem(key);
    if (!savedData) return null;
    return JSON.parse(savedData) as PersistedProgress;
  } catch (error) {
    console.error("Failed to load or parse progress from localStorage:", error);
    return null;
  }
}
