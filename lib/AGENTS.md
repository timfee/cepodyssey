# Library Guidelines

## Structure Overview

The `lib/` directory contains all shared utilities, type definitions, and business logic that's reused across the application.

```
lib/
├── api/              # External service clients
├── redux/            # Redux Toolkit state management
├── steps.ts          # Step definitions and orchestration
├── types.ts          # Centralized TypeScript definitions
└── utils.ts          # Utility functions
```

## Type System (`types.ts`)

### Core Type Patterns

```typescript
// Result types for consistent API responses
export interface StepExecutionResult {
  success: boolean;
  message?: string;
  resourceUrl?: string;
  outputs?: Record<string, unknown>;
  error?: { message: string; code?: string };
}

// Context for step execution
export interface StepContext {
  domain: string;
  tenantId: string;
  outputs: Record<string, unknown>;
}

// Step status management
export interface StepStatusInfo {
  status: "pending" | "in_progress" | "completed" | "failed";
  error?: string | null;
  message?: string;
  metadata?: Record<string, unknown>;
}
```

### Output Keys System

```typescript
// Centralized constants for step data flow
export const OUTPUT_KEYS = {
  AUTOMATION_OU_ID: "g1AutomationOuId",
  PROVISIONING_APP_ID: "m1ProvisioningAppId",
  GOOGLE_SAML_SP_ENTITY_ID: "g5GoogleSamlSpEntityId",
  // Never hardcode these strings elsewhere
} as const;
```

## API Clients (`api/`)

### Error Handling Pattern

```typescript
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Retry logic for resilience
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error instanceof APIError && error.status < 500) {
        throw error; // Don't retry client errors
      }
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}
```

### HTTP Client Pattern

```typescript
export async function fetchWithAuth(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return withRetry(() =>
    fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }),
  );
}
```

## Redux Toolkit State (`redux/`)

### Slice Patterns

```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AppConfigState {
  domain: string | null;
  tenantId: string | null;
  outputs: Record<string, unknown>;
}

export const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {
    // Use Immer-style mutations (Redux Toolkit handles immutability)
    addOutputs(state, action: PayloadAction<Record<string, unknown>>) {
      state.outputs = { ...state.outputs, ...action.payload };
    },
    setDomain(state, action: PayloadAction<string>) {
      state.domain = action.payload;
    },
  },
});

export const { addOutputs, setDomain } = appConfigSlice.actions;
```

### Store Configuration

```typescript
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: {
    appConfig: appConfigSlice.reducer,
    setupSteps: setupStepsSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // For dates and complex objects
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Step System (`steps.ts`)

### Step Definition Pattern

```typescript
export const allStepDefinitions: StepDefinition[] = [
  {
    id: "G-1",
    title: "Create Automation OU",
    description: "Creates an organizational unit for automation...",
    category: "Google",
    automatable: true,
    requires: [], // Dependencies
    check: async (context: StepContext): Promise<StepCheckResult> => {
      return checkOrgUnitExists("/Automation");
    },
    execute: async (context: StepContext): Promise<StepExecutionResult> => {
      return executeG1CreateAutomationOu(context);
    },
    adminUrls: {
      configure: "https://admin.google.com/ac/orgunits",
      verify: (outputs) =>
        outputs[OUTPUT_KEYS.AUTOMATION_OU_ID]
          ? `https://admin.google.com/specific-url/${outputs[OUTPUT_KEYS.AUTOMATION_OU_ID]}`
          : null,
    },
  },
];
```

## Utility Standards

- Pure functions where possible
- Consistent error handling with APIError
- TypeScript strict mode compliance
- JSDoc comments for complex functions

## Integration Rules

- All external API calls go through `lib/api/` clients
- Step definitions are the single source of truth for automation
- Types defined once in `types.ts`, imported everywhere else
- Redux state changes only through defined actions
- Use OUTPUT_KEYS constants for all step data flow
