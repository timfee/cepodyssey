import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ManagedStep } from "@/lib/types";

interface StepDetailsModalState {
  isOpen: boolean;
  step: ManagedStep | null;
  outputs: Record<string, unknown>;
}

interface StepOutputsModalState {
  isOpen: boolean;
  step: ManagedStep | null;
  outputs: Record<string, unknown>;
  allStepsStatus: Record<string, { status: string }>;
}

interface ModalsState {
  stepDetails: StepDetailsModalState;
  stepOutputs: StepOutputsModalState;
}

const initialState: ModalsState = {
  stepDetails: {
    isOpen: false,
    step: null,
    outputs: {},
  },
  stepOutputs: {
    isOpen: false,
    step: null,
    outputs: {},
    allStepsStatus: {},
  },
};

export const modalsSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    // Step Details Modal
    openStepDetailsModal(
      state,
      action: PayloadAction<{
        step: ManagedStep;
        outputs: Record<string, unknown>;
      }>
    ) {
      state.stepDetails.isOpen = true;
      state.stepDetails.step = action.payload.step;
      state.stepDetails.outputs = action.payload.outputs;
    },
    closeStepDetailsModal(state) {
      state.stepDetails.isOpen = false;
      state.stepDetails.step = null;
      state.stepDetails.outputs = {};
    },

    // Step Outputs Modal
    openStepOutputsModal(
      state,
      action: PayloadAction<{
        step: ManagedStep;
        outputs: Record<string, unknown>;
        allStepsStatus: Record<string, { status: string }>;
      }>
    ) {
      state.stepOutputs.isOpen = true;
      state.stepOutputs.step = action.payload.step;
      state.stepOutputs.outputs = action.payload.outputs;
      state.stepOutputs.allStepsStatus = action.payload.allStepsStatus;
    },
    closeStepOutputsModal(state) {
      state.stepOutputs.isOpen = false;
      state.stepOutputs.step = null;
      state.stepOutputs.outputs = {};
      state.stepOutputs.allStepsStatus = {};
    },

    // Close all modals (useful for cleanup)
    closeAllModals(state) {
      state.stepDetails.isOpen = false;
      state.stepOutputs.isOpen = false;
    },
  },
});

export const {
  openStepDetailsModal,
  closeStepDetailsModal,
  openStepOutputsModal,
  closeStepOutputsModal,
  closeAllModals,
} = modalsSlice.actions;

export default modalsSlice.reducer;

// Selectors
export const selectStepDetailsModal = (state: { modals: ModalsState }) =>
  state.modals.stepDetails;
export const selectStepOutputsModal = (state: { modals: ModalsState }) =>
  state.modals.stepOutputs;
