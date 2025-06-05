import type { AppConfigState } from "@/lib/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const initialState: AppConfigState = {
  domain: null,
  tenantId: null,
  outputs: {},
};

export const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {
    /** Initializes the config state, e.g. from the server or persistence. */
    initializeConfig(state, action: PayloadAction<Partial<AppConfigState>>) {
      state.domain = action.payload.domain ?? state.domain;
      state.tenantId = action.payload.tenantId ?? state.tenantId;
      state.outputs = { ...state.outputs, ...(action.payload.outputs ?? {}) };
    },
    setInitialConfig(
      state,
      action: PayloadAction<{ domain: string | null; tenantId: string | null }>,
    ) {
      state.domain = action.payload.domain;
      state.tenantId = action.payload.tenantId;
    },
    setDomain(state, action: PayloadAction<string>) {
      state.domain = action.payload;
    },
    setTenantId(state, action: PayloadAction<string>) {
      state.tenantId = action.payload;
    },
    /** Adds or updates a single output value from a step execution. */
    addOutput(state, action: PayloadAction<{ key: string; value: unknown }>) {
      state.outputs[action.payload.key] = action.payload.value;
    },
    /** Merges a batch of outputs, e.g. from a check result. */
    addOutputs(state, action: PayloadAction<Record<string, unknown>>) {
      state.outputs = { ...state.outputs, ...action.payload };
    },
    resetAuthState(state) {
      state.outputs = {};
      console.log("Auth state reset due to session expiration");
    },
    clearAllData(state) {
      state.domain = null;
      state.tenantId = null;
      state.outputs = {};
    },
  },
});

export const {
  initializeConfig,
  setInitialConfig,
  setDomain,
  setTenantId,
  addOutput,
  addOutputs,
  resetAuthState,
  clearAllData,
} = appConfigSlice.actions;

export default appConfigSlice.reducer;
