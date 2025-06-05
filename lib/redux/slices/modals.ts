import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ManagedStep } from "@/lib/types";

interface StepDetailsModalState {
  isOpen: boolean;
  step: ManagedStep | null;
  outputs: Record<string, unknown>;
}

interface AskAdminModalState {
  isOpen: boolean;
  step: ManagedStep | null;
}

interface ModalsState {
  stepDetails: StepDetailsModalState;
  askAdmin: AskAdminModalState;
}

const initialState: ModalsState = {
  stepDetails: {
    isOpen: false,
    step: null,
    outputs: {},
  },
  askAdmin: {
    isOpen: false,
    step: null,
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
    // Ask Admin Modal
    openAskAdminModal(state, action: PayloadAction<{ step: ManagedStep }>) {
      state.askAdmin.isOpen = true;
      state.askAdmin.step = action.payload.step;
    },
    closeAskAdminModal(state) {
      state.askAdmin.isOpen = false;
      state.askAdmin.step = null;
    },

    // Close all modals (useful for cleanup)
    closeAllModals(state) {
      state.stepDetails.isOpen = false;
      state.askAdmin.isOpen = false;
    },
  },
});

export const {
  openStepDetailsModal,
  closeStepDetailsModal,
  closeAllModals,
  openAskAdminModal,
  closeAskAdminModal,
} = modalsSlice.actions;

export default modalsSlice.reducer;

// Selectors
export const selectStepDetailsModal = (state: { modals: ModalsState }) =>
  state.modals.stepDetails;
export const selectAskAdminModal = (state: { modals: ModalsState }) =>
  state.modals.askAdmin;
