import { useAppDispatch, useAppSelector } from "@/hooks/use-redux";
import { StepStatus, type StepStatusType } from "@/lib/constants/enums";
import {
  loadProgress,
  saveProgress,
  type PersistedProgress,
} from "@/lib/redux/persistence";

import { addOutputs, initializeSteps } from "@/lib/redux/slices/app-state";

import type { RootState } from "@/lib/redux/store";
import { allStepDefinitions } from "@/lib/steps";
import { useEffect } from "react";
import { useStore } from "react-redux";

export function useProgressPersistence() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const domain = useAppSelector((state: RootState) => state.app.domain);
  const stepsStatusMap = useAppSelector((state: RootState) => state.app.steps);

  useEffect(() => {
    if (domain && domain !== "") {
      const persisted: PersistedProgress | null = loadProgress(domain);
      if (persisted) {
        dispatch(initializeSteps(persisted.steps));
        dispatch(addOutputs(persisted.outputs || {}));
      } else {
        const initialStatuses: Record<string, { status: StepStatusType }> = {};
        allStepDefinitions.forEach((def) => {
          initialStatuses[def.id] = { status: StepStatus.PENDING };
        });
        dispatch(initializeSteps(initialStatuses));
      }
    }
  }, [domain, dispatch]);

  useEffect(() => {
    if (domain && domain !== "") {
      void saveProgress(domain, {
        steps: stepsStatusMap,
        outputs: store.getState().app.outputs,
      });
    }
  }, [domain, stepsStatusMap, store]);
}
