import { configureStore } from "@reduxjs/toolkit";
import { appStateSlice } from "./slices/app-state";
import { uiStateSlice } from "./slices/ui-state";
import { config } from "@/lib/config";

/**
 * Central Redux store instance. DevTools and runtime checks are enabled
 * unless the app is running in production.
 */
export const store = configureStore({
  reducer: {
    app: appStateSlice.reducer,
    ui: uiStateSlice.reducer,
  },
  devTools: config.NODE_ENV !== "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow Date objects in state metadata
      serializableCheck: config.NODE_ENV !== "production",
      immutableCheck: config.NODE_ENV !== "production",
    }),
});

/** Root state type derived from the store. */
export type RootState = ReturnType<typeof store.getState>;
/** Dispatch type for useAppDispatch hook. */
export type AppDispatch = typeof store.dispatch;
