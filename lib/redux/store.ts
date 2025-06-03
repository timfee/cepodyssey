import { configureStore } from "@reduxjs/toolkit";
import { appConfigSlice } from "./slices/app-config";
import { setupStepsSlice } from "./slices/setup-steps";

export const store = configureStore({
  reducer: {
    appConfig: appConfigSlice.reducer,
    setupSteps: setupStepsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disabling for simplicity with non-serializable data like dates if needed
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
