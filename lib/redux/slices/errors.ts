import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

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
  name: 'errors',
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

export const selectError = (state: RootState): ErrorInfo =>
  state.errors.error || { message: '' };

export default errorsSlice.reducer;
