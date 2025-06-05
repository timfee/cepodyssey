import { configureStore } from "@reduxjs/toolkit";
import { appStateSlice } from "./slices/app-state";
import { uiStateSlice } from "./slices/ui-state";
import { config } from "@/lib/config";

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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
