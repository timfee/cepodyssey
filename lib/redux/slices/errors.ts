import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

// Define all possible error action types
export enum ErrorActionType {
  SIGN_IN = "SIGN_IN",
  OPEN_URL = "OPEN_URL",
  ENABLE_API = "ENABLE_API",
  RETRY_STEP = "RETRY_STEP",
  DISMISS = "DISMISS",
}

// Define icon names as string literals
export type ErrorIconName =
  | "LogInIcon"
  | "ExternalLinkIcon"
  | "RefreshCwIcon"
  | "AlertCircleIcon";

// Error action descriptor (serializable)
export interface ErrorAction {
  type: ErrorActionType;
  label: string;
  variant?: "default" | "outline" | "destructive";
  icon?: ErrorIconName;
  payload?: Record<string, unknown>; // For URLs, step IDs, etc.
}

export interface ErrorInfo {
  title: string;
  message: string;
  code?: string;
  provider?: "google" | "microsoft" | "both";
  details?: Record<string, unknown>;
  actions?: ErrorAction[];
  diagnostics?: {
    timestamp: string;
    stepId?: string;
    stepTitle?: string;
    sessionInfo?: {
      hasGoogleAuth: boolean;
      hasMicrosoftAuth: boolean;
      domain?: string;
      tenantId?: string;
    };
    apiResponse?: {
      status?: number;
      statusText?: string;
      headers?: Record<string, string>;
      body?: unknown;
    };
    stackTrace?: string;
    environment?: {
      nodeEnv: string;
      logLevel: string;
    };
  };
}

interface ErrorHistoryEntry {
  error: ErrorInfo;
  timestamp: string;
  dismissed: boolean;
}

interface ErrorState {
  activeError: ErrorInfo | null;
  errorHistory: ErrorHistoryEntry[];
  isDismissible: boolean;
}

const initialState: ErrorState = {
  activeError: null,
  errorHistory: [],
  isDismissible: true,
};

export const errorsSlice = createSlice({
  name: "errors",
  initialState,
  reducers: {
    showError(
      state,
      action: PayloadAction<{
        error: ErrorInfo;
        dismissible?: boolean;
      }>,
    ) {
      state.activeError = action.payload.error;
      state.isDismissible = action.payload.dismissible ?? true;
      state.errorHistory.push({
        error: action.payload.error,
        timestamp: new Date().toISOString(),
        dismissed: false,
      });
    },
    dismissError(state) {
      if (state.activeError) {
        const last = state.errorHistory[state.errorHistory.length - 1];
        if (last) last.dismissed = true;
      }
      state.activeError = null;
      state.isDismissible = true;
    },
    clearErrorHistory(state) {
      state.errorHistory = [];
    },
  },
});

export const { showError, dismissError, clearErrorHistory } = errorsSlice.actions;

export const selectActiveError = (state: RootState): ErrorInfo | null =>
  state.errors.activeError;
export const selectIsDismissible = (state: RootState): boolean =>
  state.errors.isDismissible;

export default errorsSlice.reducer;
