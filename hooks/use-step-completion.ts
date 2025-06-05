import { useState, useEffect } from "react";
import { secureStorage } from "@/lib/storage";

/**
 * Tracks completion state for a step using local storage so progress persists
 * across sessions.
 *
 * @param stepId - Unique identifier of the step
 * @param initialCompleted - Whether the step should start as completed
 * @returns Tuple of completion flag and setter
 */
export function useStepCompletion(
  stepId: string,
  initialCompleted: boolean = false,
) {
  const storageKey = `workflow-step-status-${stepId}`;

  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === "undefined") return initialCompleted;
    const stored = secureStorage.load<boolean>(storageKey);
    return stored ?? initialCompleted;
  });

  useEffect(() => {
    secureStorage.save(storageKey, isCompleted);
  }, [isCompleted, storageKey]);

  return [isCompleted, setIsCompleted] as const;
}
