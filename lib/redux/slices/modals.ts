import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ManagedStep } from "@/lib/types";

interface StepDetailsModalState {
  isOpen: boolean;
  step: ManagedStep | null;
  outputs: Record<string, unknown>;
}

interface ModalsState {
  stepDetails: StepDetailsModalState;
}

const initialState: ModalsState = {
  stepDetails: {
    isOpen: false,
    step: null,
    outputs: {},
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
      }>,
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


    // Close all modals (useful for cleanup)
    closeAllModals(state) {
      state.stepDetails.isOpen = false;
    },
  },
});

export const {
  openStepDetailsModal,
  closeStepDetailsModal,
  closeAllModals,
} = modalsSlice.actions;

export default modalsSlice.reducer;

// Selectors
export const selectStepDetailsModal = (state: { modals: ModalsState }) =>
  state.modals.stepDetails;
