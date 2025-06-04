import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { ErrorDialogProps } from "@/components/ui/error-dialog";

interface ErrorHistoryEntry {
  error: ErrorDialogProps["error"];
  timestamp: string;
  dismissed: boolean;
}

interface ErrorState {
  activeError: ErrorDialogProps["error"] | null;
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
        error: ErrorDialogProps["error"];
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
    addDiagnostics(
      state,
      action: PayloadAction<Partial<ErrorDialogProps["error"]["diagnostics"]>>,
    ) {
      if (state.activeError) {
        state.activeError.diagnostics = {
          ...(state.activeError.diagnostics ?? {
            timestamp: new Date().toISOString(),
          }),
          ...action.payload,
        } as ErrorDialogProps["error"]["diagnostics"];
      }
    },
  },
});

export const { showError, dismissError, clearErrorHistory, addDiagnostics } =
  errorsSlice.actions;

export const selectActiveError = (
  state: RootState,
): ErrorDialogProps["error"] | null => state.errors.activeError;
export const selectIsDismissible = (state: RootState): boolean =>
  state.errors.isDismissible;

export default errorsSlice.reducer;
