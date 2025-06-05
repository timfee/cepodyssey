import { useState, useEffect } from "react";

export function useStepCompletion(
  stepId: string,
  initialCompleted: boolean = false,
) {
  const storageKey = `workflow-step-status-${stepId}`;

  const [isCompleted, setIsCompleted] = useState(() => {
    if (typeof window === "undefined") return initialCompleted;
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : initialCompleted;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isCompleted));
  }, [isCompleted, storageKey]);

  return [isCompleted, setIsCompleted] as const;
}
