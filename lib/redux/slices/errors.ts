import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface ErrorInfo {
  message: string;
  details?: unknown;
}

export interface ErrorState {
  error: ErrorInfo | null;
}

const initialState: ErrorState = {
  error: null,
};

export const errorsSlice = createSlice({
  name: "errors",
  initialState,
  reducers: {
    setError(state, action: PayloadAction<ErrorInfo>) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const { setError, clearError } = errorsSlice.actions;

export const selectError = createSelector(
  (state: RootState) => state.errors.error,
  (error): ErrorInfo => error || { message: "", details: undefined },
);

export const selectHasError = createSelector(
  (state: RootState) => state.errors.error,
  (error): boolean => !!error,
);

export default errorsSlice.reducer;
