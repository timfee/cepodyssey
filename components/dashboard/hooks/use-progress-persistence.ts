import { useEffect } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { loadProgress, saveProgress, type PersistedProgress } from "@/lib/redux/persistence";
import { addOutputs } from "@/lib/redux/slices/app-config";
import { initializeSteps } from "@/lib/redux/slices/setup-steps";
import { allStepDefinitions } from "@/lib/steps";
import type { RootState } from "@/lib/redux/store";

export function useProgressPersistence() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const appConfig = useAppSelector((state: RootState) => state.appConfig);
  const stepsStatusMap = useAppSelector((state: RootState) => state.setupSteps.steps);

  useEffect(() => {
    if (appConfig.domain && appConfig.domain !== "") {
      const persisted: PersistedProgress | null = loadProgress(appConfig.domain);
      if (persisted) {
        dispatch(initializeSteps(persisted.steps));
        dispatch(addOutputs(persisted.outputs || {}));
      } else {
        const initialStatuses: Record<string, { status: "pending" }> = {};
        allStepDefinitions.forEach((def) => {
          initialStatuses[def.id] = { status: "pending" };
        });
        dispatch(initializeSteps(initialStatuses));
      }
    }
  }, [appConfig.domain, dispatch]);

  useEffect(() => {
    if (appConfig.domain && appConfig.domain !== "") {
      void saveProgress(appConfig.domain, {
        steps: stepsStatusMap,
        outputs: store.getState().appConfig.outputs,
      });
    }
  }, [appConfig.domain, stepsStatusMap, store]);
}
