import type { StepStatusInfo } from "@/lib/types";
import { StepStatus } from "@/lib/constants/enums";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SetupStepsState {
  steps: Record<string, StepStatusInfo>;
  userCompletions: Record<string, boolean>;
}

const initialState: SetupStepsState = {
  steps: {},
  userCompletions: {},
};

export const setupStepsSlice = createSlice({
  name: "setupSteps",
  initialState,
  reducers: {
    /** Initializes all steps from persisted data. */
    initializeSteps(
      state,
      action: PayloadAction<Record<string, StepStatusInfo>>,
    ) {
      state.steps = action.payload;
    },
    /** Updates the status and metadata of a single step. */
    updateStep(state, action: PayloadAction<{ id: string } & StepStatusInfo>) {
      const { id, ...statusInfo } = action.payload;
      const existingStep = state.steps[id] ?? { status: StepStatus.PENDING };
      state.steps[id] = { ...existingStep, ...statusInfo };
    },
    markStepComplete(
      state,
      action: PayloadAction<{ id: string; isUserMarked: boolean }>,
    ) {
      const { id, isUserMarked } = action.payload;
      state.steps[id] = {
        ...state.steps[id],
        status: StepStatus.COMPLETED,
        completionType: isUserMarked ? "user-marked" : "server-verified",
      };
      if (isUserMarked) {
        state.userCompletions[id] = true;
      }
    },
    markStepIncomplete(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.steps[id] = {
        ...state.steps[id],
        status: StepStatus.PENDING,
        completionType: undefined,
      };
      state.userCompletions[id] = false;
    },
    clearCheckTimestamp(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.steps[id]) {
        state.steps[id].lastCheckedAt = undefined;
      }
    },
    clearAllCheckTimestamps(state) {
      Object.values(state.steps).forEach((step) => {
        step.lastCheckedAt = undefined;
      });
    },
  },
});

export const {
  initializeSteps,
  updateStep,
  markStepComplete,
  markStepIncomplete,
  clearCheckTimestamp,
  clearAllCheckTimestamps,
} = setupStepsSlice.actions;

export default setupStepsSlice.reducer;
