import { useEffect } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { loadProgress, saveProgress, type PersistedProgress } from "@/lib/redux/persistence";
import { addOutputs, initializeSteps } from "@/lib/redux/slices/app-state";
import { allStepDefinitions } from "@/lib/steps";
import type { RootState } from "@/lib/redux/store";

export function useProgressPersistence() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const appConfig = useAppSelector((state: RootState) => state.app);
  const stepsStatusMap = useAppSelector((state: RootState) => state.app.steps);

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
      saveProgress(appConfig.domain, {
        steps: stepsStatusMap,
        outputs: store.getState().app.outputs,
      });
    }
  }, [appConfig.domain, stepsStatusMap, store]);
}
