import { configureStore } from "@reduxjs/toolkit";
import { appStateSlice } from "./slices/app-state";
import { uiStateSlice } from "./slices/ui-state";

export const store = configureStore({
  reducer: {
    appState: appStateSlice.reducer,
    uiState: uiStateSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow Date objects in state metadata
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
