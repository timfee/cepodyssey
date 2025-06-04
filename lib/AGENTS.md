# Library Guidelines

## Structure Overview

The `lib/` directory contains all shared utilities, type definitions, and business logic that's reused across the application.

```
lib/
├── api/              # External service clients
├── redux/            # Redux Toolkit state management
├── steps/            # Step definitions and orchestration
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
  // Google Outputs
  AUTOMATION_OU_ID: "g1AutomationOuId",
  SERVICE_ACCOUNT_EMAIL: "g2ServiceAccountEmail",
  GOOGLE_SAML_SP_ENTITY_ID: "g5GoogleSamlSpEntityId",

  // Microsoft Outputs
  PROVISIONING_APP_ID: "m1ProvisioningAppId",
  FLAG_M3_PROV_CREDS_CONFIGURED: "flagM3ProvCredsConfigured",

  // Cross-System Outputs
  IDP_ENTITY_ID: "m8IdpEntityId",
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

## Step System (`steps/`)

### Step Definition Pattern

```typescript
export const allStepDefinitions: StepDefinition[] = [
  {
    id: "G-2",
    title: "Create Provisioning User in 'Automation' OU",
    description:
      "Creates a dedicated user (e.g., azuread-provisioning@yourdomain.com) used later for Azure authorization.",
    category: "Google",
    automatable: true,
    requires: ["G-1"],
    adminUrls: {
      configure: "https://admin.google.com/ac/users",
    },
  },
  {
    id: "M-3",
    title: "Authorize Azure AD Provisioning to Google Workspace",
    description:
      "GUIDANCE: Go to the 'Google Cloud (Provisioning)' app in Azure Portal and authorize using the provisioning user.",
    category: "Microsoft",
    automatable: false,
    requires: ["G-2", "M-2"],
    adminUrls: {
      configure: (outputs) => {
        const appId = outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
        return appId
          ? `https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/${appId}`
          : null;
      },
    },
  },
];

// Note: The actual check and execute functions for these steps are registered in
// `app/actions/step-registry.ts` and implemented as server actions.
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

## URL Builder System (`api/url-builder.ts`)

### Architecture

The URL builder provides a centralized, type-safe system for all URL construction:

```typescript
// API Base URLs from environment
export const API_BASES = {
  googleDirectory: process.env.GOOGLE_API_BASE,
  googleIdentity: process.env.GOOGLE_IDENTITY_BASE,
  microsoftGraph: process.env.GRAPH_API_BASE,
};

// Structured URL builders for each service
export const googleDirectoryUrls = {
  users: {
    get: (userKey: string) =>
      `${API_BASES.googleDirectory}/users/${encodeURIComponent(userKey)}`,
  },
};
```

### Key Principles

1. **No Hardcoded URLs**: All URLs constructed through the builder
2. **Automatic Encoding**: Uses `encodeURIComponent` and URL class
3. **Environment Aware**: Base URLs from environment variables
4. **Type Safe**: TypeScript ensures correct parameter types
5. **Consistent Structure**: Organized by service and resource type

### Usage Patterns

```typescript
// API URLs
const url = googleDirectoryUrls.users.get(userEmail);

// Portal URLs with proper encoding
const adminUrl = portalUrls.google.sso.samlProfile(profileFullName);

// Query parameters using URL class
const listUrl = new URL(microsoftGraphUrls.applications.list());
listUrl.searchParams.append("$filter", filter);
```

### Special Cases

#### Google SAML Profile URLs

The Google Admin Console expects SAML profile IDs in a specific format:

```typescript
// Profile full name: "inboundSamlSsoProfiles/12345"
// Admin Console URL: /sso-profiles/inboundSamlSsoProfiles%2F12345

samlProfile: (profileFullName: string) => {
  const profileId = profileFullName.split("/").pop();
  const encodedProfileRef = `inboundSamlSsoProfiles${encodeURIComponent("/" + profileId)}`;
  return `${PORTAL_BASES.googleAdmin}/ac/security/sso/sso-profiles/${encodedProfileRef}`;
}
```

#### Azure Portal Parameter Inconsistency

Azure Portal uses different parameter names across blades:

```typescript
// Overview and UsersAndGroups use servicePrincipalId
overview: (spId, appId) => `.../Overview/servicePrincipalId/${spId}/appId/${appId}`

// ProvisioningManagement and SingleSignOn use objectId
provisioning: (spId, appId) => `.../ProvisioningManagement/appId/${appId}/objectId/${spId}`
```

## Enhanced Error Handling

### Authentication Error Detection

The system now includes comprehensive auth error detection:

```typescript
const AUTH_ERROR_PATTERNS = {
  google: [
    /invalid authentication credentials/i,
    /OAuth 2 access token/i,
    /Token has been expired or revoked/i,
  ],
  microsoft: [
    /InvalidAuthenticationToken/i,
    /Access token validation failure/i,
    /Token expired/i,
  ],
};
```

### Error Flow

1. **API Client**: Detects 401 status or error patterns
2. **Auth Interceptor**: Wraps as `AuthenticationError` with provider
3. **Server Action**: Converts to result with error metadata
4. **UI Component**: Shows notification with sign-in action

This prevents unhandled promise rejections and provides clear user guidance.
