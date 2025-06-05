import { useState, useEffect } from "react";
import { secureStorage } from "@/lib/storage";

export function useStepCompletion(
  stepId: string,
  initialCompleted: boolean = false,
) {
  const storageKey = `workflow-step-status-${stepId}`;

  const [isCompleted, setIsCompleted] = useState(initialCompleted);

  useEffect(() => {
    async function load() {
      const stored = await secureStorage.load<boolean>(storageKey);
      if (stored !== null) {
        setIsCompleted(stored);
      }
    }
    void load();
  }, [storageKey]);

  useEffect(() => {
    void secureStorage.save(storageKey, isCompleted);
  }, [isCompleted, storageKey]);

  return [isCompleted, setIsCompleted] as const;
}
