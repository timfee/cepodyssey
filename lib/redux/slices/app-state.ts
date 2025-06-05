import type { AppConfigState, StepStatusInfo } from "@/lib/types";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AppState extends AppConfigState {
  steps: Record<string, StepStatusInfo>;
  userCompletions: Record<string, boolean>;
}

const initialState: AppState = {
  domain: null,
  tenantId: null,
  outputs: {},
  steps: {},
  userCompletions: {},
};

export const appStateSlice = createSlice({
  name: "appState",
  initialState,
  reducers: {
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
    addOutput(state, action: PayloadAction<{ key: string; value: unknown }>) {
      state.outputs[action.payload.key] = action.payload.value;
    },
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
      state.steps = {};
      state.userCompletions = {};
    },
    initializeSteps(state, action: PayloadAction<Record<string, StepStatusInfo>>) {
      state.steps = action.payload;
    },
    updateStep(state, action: PayloadAction<{ id: string } & StepStatusInfo>) {
      const { id, ...statusInfo } = action.payload;
      const existingStep = state.steps[id] ?? { status: "pending" };
      state.steps[id] = { ...existingStep, ...statusInfo };
    },
    markStepComplete(
      state,
      action: PayloadAction<{ id: string; isUserMarked: boolean }>,
    ) {
      const { id, isUserMarked } = action.payload;
      state.steps[id] = {
        ...state.steps[id],
        status: "completed",
        completionType: isUserMarked ? "user-marked" : "server-verified",
      };
      if (isUserMarked) {
        state.userCompletions[id] = true;
      }
    },
    markStepIncomplete(state, action: PayloadAction<string>) {
      const id = action.payload;
      state.steps[id] = {
        ...state.steps[id],
        status: "pending",
        completionType: undefined,
      };
      state.userCompletions[id] = false;
    },
    clearCheckTimestamp(state, action: PayloadAction<string>) {
      const id = action.payload;
      if (state.steps[id]) {
        state.steps[id].lastCheckedAt = undefined;
      }
    },
    clearAllCheckTimestamps(state) {
      Object.values(state.steps).forEach((step) => {
        step.lastCheckedAt = undefined;
      });
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
  initializeSteps,
  updateStep,
  markStepComplete,
  markStepIncomplete,
  clearCheckTimestamp,
  clearAllCheckTimestamps,
} = appStateSlice.actions;

export default appStateSlice.reducer;
