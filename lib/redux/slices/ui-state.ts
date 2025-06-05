import { createSlice, type PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { ManagedStep } from "@/lib/types";

export interface ErrorInfo {
  message: string;
  details?: unknown;
}

export interface StepDetailsModalState {
  isOpen: boolean;
  step: ManagedStep | null;
  outputs: Record<string, unknown>;
}

export interface AskAdminModalState {
  isOpen: boolean;
  step: ManagedStep | null;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  level: string;
  provider?: "google" | "microsoft" | "other";
  metadata: Record<string, unknown>;
}

interface UIState {
  error: ErrorInfo | null;
  modals: {
    stepDetails: StepDetailsModalState;
    askAdmin: AskAdminModalState;
  };
  debugPanel: {
    logs: ApiLogEntry[];
  };
}

const initialState: UIState = {
  error: null,
  modals: {
    stepDetails: { isOpen: false, step: null, outputs: {} },
    askAdmin: { isOpen: false, step: null },
  },
  debugPanel: {
    logs: [],
  },
};

export const uiStateSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setError(state, action: PayloadAction<ErrorInfo>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    openStepDetailsModal(
      state,
      action: PayloadAction<{ step: ManagedStep; outputs: Record<string, unknown> }>,
    ) {
      state.modals.stepDetails.isOpen = true;
      state.modals.stepDetails.step = action.payload.step;
      state.modals.stepDetails.outputs = action.payload.outputs;
    },
    closeStepDetailsModal(state) {
      state.modals.stepDetails.isOpen = false;
      state.modals.stepDetails.step = null;
      state.modals.stepDetails.outputs = {};
    },
    openAskAdminModal(state, action: PayloadAction<{ step: ManagedStep }>) {
      state.modals.askAdmin.isOpen = true;
      state.modals.askAdmin.step = action.payload.step;
    },
    closeAskAdminModal(state) {
      state.modals.askAdmin.isOpen = false;
      state.modals.askAdmin.step = null;
    },
    closeAllModals(state) {
      state.modals.stepDetails.isOpen = false;
      state.modals.askAdmin.isOpen = false;
    },
    addApiLog(state, action: PayloadAction<ApiLogEntry>) {
      state.debugPanel.logs.unshift(action.payload);
      if (state.debugPanel.logs.length > 100) state.debugPanel.logs.pop();
    },
    clearApiLogs(state) {
      state.debugPanel.logs = [];
    },
  },
});

export const {
  setError,
  clearError,
  openStepDetailsModal,
  closeStepDetailsModal,
  openAskAdminModal,
  closeAskAdminModal,
  closeAllModals,
  addApiLog,
  clearApiLogs,
} = uiStateSlice.actions;

export default uiStateSlice.reducer;

export const selectStepDetailsModal = (state: { ui: UIState }) =>
  state.ui.modals.stepDetails;
export const selectAskAdminModal = (state: { ui: UIState }) =>
  state.ui.modals.askAdmin;

export const selectError = createSelector(
  (state: RootState) => state.ui.error,
  (error): ErrorInfo => error || { message: "", details: undefined },
);

export const selectHasError = createSelector(
  (state: RootState) => state.ui.error,
  (error): boolean => !!error,
);
