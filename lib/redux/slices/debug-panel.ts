import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ProviderValue } from "@/lib/types";

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
  provider?: ProviderValue | "other";
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
  filter: "all" | ProviderValue | "errors";
}

const initialState: DebugPanelState = {
  isOpen: false,
  logs: [],
  maxLogs: 50,
  filter: "all",
};

export const debugPanelSlice = createSlice({
  name: "debugPanel",
  initialState,
  reducers: {
    toggleDebugPanel(state) {
      state.isOpen = !state.isOpen;
    },
    openDebugPanel(state) {
      state.isOpen = true;
    },
    closeDebugPanel(state) {
      state.isOpen = false;
    },
    addApiLog(state, action: PayloadAction<ApiLogEntry>) {
      state.logs.unshift(action.payload);
      if (state.logs.length > state.maxLogs) {
        state.logs.pop();
      }
    },
    clearLogs(state) {
      state.logs = [];
    },
    setFilter(state, action: PayloadAction<DebugPanelState["filter"]>) {
      state.filter = action.payload;
    },
    updateApiLog(
      state,
      action: PayloadAction<{ id: string; updates: Partial<ApiLogEntry> }>,
    ) {
      const log = state.logs.find((l) => l.id === action.payload.id);
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
      state.logs.unshift(entry);
      if (state.logs.length > state.maxLogs) {
        state.logs.pop();
      }
    },
  },
});

export const {
  toggleDebugPanel,
  openDebugPanel,
  closeDebugPanel,
  addApiLog,
  addAppError,
  clearLogs,
  setFilter,
  updateApiLog,
} = debugPanelSlice.actions;

export default debugPanelSlice.reducer;

// Selectors
export const selectDebugPanel = (state: { debugPanel: DebugPanelState }) =>
  state.debugPanel;
export const selectFilteredLogs = (state: { debugPanel: DebugPanelState }) => {
  const { logs, filter } = state.debugPanel;
  if (filter === "all") return logs;
  if (filter === "errors")
    return logs.filter(
      (log) => log.error || (log.responseStatus && log.responseStatus >= 400),
    );
  return logs.filter((log) => log.provider === filter);
};
