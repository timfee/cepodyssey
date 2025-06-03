import type { StepStatusInfo } from "@/lib/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface SetupStepsState {
  steps: Record<string, StepStatusInfo>;
}

const initialState: SetupStepsState = {
  steps: {},
};

export const setupStepsSlice = createSlice({
  name: "setupSteps",
  initialState,
  reducers: {
    /** Initializes all steps from persisted data. */
    initializeSteps(
      state,
      action: PayloadAction<Record<string, StepStatusInfo>>
    ) {
      state.steps = action.payload;
    },
    /** Updates the status and metadata of a single step. */
    updateStep(state, action: PayloadAction<{ id: string } & StepStatusInfo>) {
      const { id, ...statusInfo } = action.payload;
      const existingStep = state.steps[id] ?? { status: "pending" };
      state.steps[id] = { ...existingStep, ...statusInfo };
    },
  },
});

export const { initializeSteps, updateStep } = setupStepsSlice.actions;

export default setupStepsSlice.reducer;
