import { configureStore } from "@reduxjs/toolkit";
import { appConfigSlice } from "./slices/app-config";
import { setupStepsSlice } from "./slices/setup-steps";
import { modalsSlice } from "./slices/modals";

export const store = configureStore({
  reducer: {
    appConfig: appConfigSlice.reducer,
    setupSteps: setupStepsSlice.reducer,
    modals: modalsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow Date objects in state metadata
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
