import { createSlice, type PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { ManagedStep } from "@/lib/types";

export interface ErrorInfo {
  message: string;
  details?: unknown;
}

interface StepDetailsModalState {
  isOpen: boolean;
  step: ManagedStep | null;
  outputs: Record<string, unknown>;
}

interface AskAdminModalState {
  isOpen: boolean;
  step: ManagedStep | null;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  requestBody?: unknown;
  responseStatus?: number;
  responseBody?: unknown;
  error?: string;
  duration?: number;
  provider?: "google" | "microsoft" | "other";
}

export interface AppErrorLogEntry {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  error?: string;
  stackTrace?: string;
}

export interface DebugPanelState {
  isOpen: boolean;
  logs: ApiLogEntry[];
  maxLogs: number;
  filter: "all" | "google" | "microsoft" | "errors";
}

interface UIState {
  error: ErrorInfo | null;
  modals: {
    stepDetails: StepDetailsModalState;
    askAdmin: AskAdminModalState;
  };
  debugPanel: DebugPanelState;
}

const initialState: UIState = {
  error: null,
  modals: {
    stepDetails: { isOpen: false, step: null, outputs: {} },
    askAdmin: { isOpen: false, step: null },
  },
  debugPanel: {
    isOpen: false,
    logs: [],
    maxLogs: 50,
    filter: "all",
  },
};

export const uiStateSlice = createSlice({
  name: "uiState",
  initialState,
  reducers: {
    // Error handling
    setError(state, action: PayloadAction<ErrorInfo>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    // Step Details Modal
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
    // Ask Admin Modal
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
    // Debug panel
    toggleDebugPanel(state) {
      state.debugPanel.isOpen = !state.debugPanel.isOpen;
    },
    openDebugPanel(state) {
      state.debugPanel.isOpen = true;
    },
    closeDebugPanel(state) {
      state.debugPanel.isOpen = false;
    },
    addApiLog(state, action: PayloadAction<ApiLogEntry>) {
      state.debugPanel.logs.unshift(action.payload);
      if (state.debugPanel.logs.length > state.debugPanel.maxLogs) {
        state.debugPanel.logs.pop();
      }
    },
    clearLogs(state) {
      state.debugPanel.logs = [];
    },
    setFilter(state, action: PayloadAction<DebugPanelState["filter"]>) {
      state.debugPanel.filter = action.payload;
    },
    updateApiLog(state, action: PayloadAction<{ id: string; updates: Partial<ApiLogEntry> }>) {
      const log = state.debugPanel.logs.find((l) => l.id === action.payload.id);
      if (log) {
        Object.assign(log, action.payload.updates);
      }
    },
    addAppError(state, action: PayloadAction<Omit<AppErrorLogEntry, "id">>) {
      const entry: ApiLogEntry = {
        id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: action.payload.timestamp,
        method: "ERROR",
        url: action.payload.category,
        error: action.payload.message,
        provider: "other",
      };
      state.debugPanel.logs.unshift(entry);
      if (state.debugPanel.logs.length > state.debugPanel.maxLogs) {
        state.debugPanel.logs.pop();
      }
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
  toggleDebugPanel,
  openDebugPanel,
  closeDebugPanel,
  addApiLog,
  addAppError,
  clearLogs,
  setFilter,
  updateApiLog,
} = uiStateSlice.actions;

export default uiStateSlice.reducer;

// Selectors
export const selectError = createSelector(
  (state: RootState) => state.uiState.error,
  (error): ErrorInfo => error || { message: "", details: undefined },
);

export const selectHasError = createSelector(
  (state: RootState) => state.uiState.error,
  (error): boolean => !!error,
);

export const selectStepDetailsModal = (state: RootState) =>
  state.uiState.modals.stepDetails;
export const selectAskAdminModal = (state: RootState) => state.uiState.modals.askAdmin;
export const selectDebugPanel = (state: RootState) => state.uiState.debugPanel;
export const selectFilteredLogs = (state: RootState) => {
  const { logs, filter } = state.uiState.debugPanel;
  if (filter === "all") return logs;
  if (filter === "errors")
    return logs.filter(
      (log) => log.error || (log.responseStatus && log.responseStatus >= 400),
    );
  return logs.filter((log) => log.provider === filter);
};
