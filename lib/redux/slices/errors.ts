import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ErrorDialogProps } from "@/components/ui/error-dialog";

interface ErrorState {
  activeError: ErrorDialogProps['error'] | null;
  isDismissible: boolean;
  errorHistory: Array<{
    error: ErrorDialogProps['error'];
    timestamp: string;
    dismissed: boolean;
  }>;
}

const initialState: ErrorState = {
  activeError: null,
  isDismissible: true,
  errorHistory: [],
};

export const errorsSlice = createSlice({
  name: "errors",
  initialState,
  reducers: {
    showError(state, action: PayloadAction<{ error: ErrorDialogProps['error']; isDismissible?: boolean }>) {
      state.activeError = action.payload.error;
      state.isDismissible = action.payload.isDismissible ?? true;
      state.errorHistory.push({
        error: action.payload.error,
        timestamp: new Date().toISOString(),
        dismissed: false,
      });
    },
    dismissError(state) {
      if (state.activeError && state.errorHistory.length > 0) {
        state.errorHistory[state.errorHistory.length - 1].dismissed = true;
      }
      state.activeError = null;
    },
    clearErrorHistory(state) {
      state.errorHistory = [];
    },
    addDiagnostics(state, action: PayloadAction<Partial<ErrorDialogProps['error']['diagnostics']>>) {
      if (state.activeError) {
        state.activeError.diagnostics = {
          ...state.activeError.diagnostics,
          ...action.payload,
        } as ErrorDialogProps['error']['diagnostics'];
      }
    },
  },
});

export const { showError, dismissError, clearErrorHistory, addDiagnostics } = errorsSlice.actions;
export default errorsSlice.reducer;

// Selectors
export const selectActiveError = (state: { errors: ErrorState }) => state.errors.activeError;
export const selectErrorDismissible = (state: { errors: ErrorState }) => state.errors.isDismissible;
export const selectErrorHistory = (state: { errors: ErrorState }) => state.errors.errorHistory;
