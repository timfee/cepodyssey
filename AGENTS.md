# Directory Setup Assistant - Agent Guidelines

## Project Overview

This is a Next.js application that automates Google Workspace and Microsoft Entra ID integration through a step-based workflow. It uses TypeScript, NextAuth for dual-provider authentication, and Redux Toolkit for state management.

The automation mirrors the official Google documentation for federating Google
Cloud with Microsoft Entra ID. The early steps create an **Automation**
organizational unit and a provisioning user in Google Workspace, then guide the
administrator through a manual OAuth consent in Azure AD. Later steps configure
automatic provisioning and SAML-based single sign-on via the _Google Cloud/G
Suite Connector by Microsoft_ gallery app. See the README for a short summary of
that workflow.

## Core Architecture Principles

### 1. Step-Based Automation

- All automation is organized into discrete steps with unique IDs (e.g., "G-1", "M-3")
- Each step has `check` and `execute` functions following a standardized interface
- Steps declare dependencies via `requires` array
- Data flows between steps via standardized `OUTPUT_KEYS`
- Provisioning credentials are established through an OAuth consent flow in Azure rather than a pre-shared token

### 2. Separation of Concerns

- **Server Actions** (`app/actions/`): All backend logic, API calls, authentication
- **Client Components** (`components/`): UI rendering, user interaction
- **Redux State** (`lib/redux/`): Client-side state management
- **API Clients** (`lib/api/`): External service integrations
- **Types** (`lib/types.ts`): Centralized TypeScript definitions

### 3. Authentication Pattern

- Dual OAuth provider setup (Google Workspace + Microsoft Entra ID)
- Admin privilege verification during sign-in
- Token refresh with retry logic
- Session-based configuration extraction
- Provisioning authorization with Azure AD occurs via a manual OAuth flow using the dedicated Google service account

## Coding Standards

### Naming Conventions

- **Files/Directories**: kebab-case (`step-details-modal.tsx`)
- **Functions/Variables**: camelCase (`executeStep`, `canRunAutomation`)
- **React Components**: PascalCase (`AutomationDashboard`, `StepItem`)
- **Types/Interfaces**: PascalCase (`StepDefinition`, `AppConfigState`)
- **Constants**: UPPER_SNAKE_CASE (`OUTPUT_KEYS`, `GWS_CUSTOMER_ID`)

### Error Handling

- Use `APIError` class for consistent API error representation
- Server actions return standardized `ActionResult<T>` or `StepExecutionResult`
- Client-side errors displayed via toast notifications (sonner)
- Graceful degradation for missing authentication or configuration

### Data Flow Pattern

```typescript
// Step outputs flow through Redux state
const context: StepContext = {
  domain: appConfig.domain,
  tenantId: appConfig.tenantId,
  outputs: store.getState().appConfig.outputs,
};

// Steps produce outputs using standardized keys
return {
  success: true,
  outputs: {
    [OUTPUT_KEYS.AUTOMATION_OU_ID]: orgUnit.orgUnitId,
    [OUTPUT_KEYS.AUTOMATION_OU_PATH]: orgUnit.orgUnitPath,
  },
};
```

## Tech Stack Specifics

### React 18 & Next.js 14

- Use App Router (not Pages Router)
- Server Components by default, Client Components with "use client"
- React 18 hooks: useTransition, useDeferredValue, useId
- Suspense boundaries for loading states

### Redux Toolkit

- Use `createSlice` for reducers
- `configureStore` for store setup
- Typed hooks via `useAppSelector` and `useAppDispatch`
- Immer integration for immutable updates

### shadcn/ui Components

- Import from `@/components/ui/[component]`
- Use existing variants and sizes
- Extend with className prop for customization
- Follow Tailwind CSS patterns

## Key Anti-Patterns to Avoid

- ❌ Don't create duplicate step execution logic
- ❌ Don't bypass the standardized output key system
- ❌ Don't mix server-side and client-side authentication logic
- ❌ Don't create multiple ways to handle the same API error types
- ❌ Don't hardcode URLs or configuration values
- ❌ Don't use Pages Router patterns in App Router context
- ❌ Don't describe user provisioning authorization as fetching a SCIM token from Google's SAML settings; it's an OAuth flow in Azure

## Integration Points

- **Google APIs**: Directory API and Cloud Identity API are used for creating the Automation OU, managing users, and configuring SAML profiles
- **Microsoft Graph**: Used to instantiate gallery apps and configure synchronization; provisioning authorization relies on the OAuth consent captured in step M-3
- **NextAuth**: Custom providers with admin verification
- **Redux**: Client state with persistence to localStorage

## Development Workflow

1. Define new steps in `lib/steps/` with proper dependencies
2. Implement server actions in `app/actions/`
3. Add UI components following existing patterns
4. Update Redux state and types as needed
5. Test authentication flows and error handling

## State Management Architecture

### Redux Store Structure

The application uses Redux Toolkit for all global state management:

```typescript
store: {
  appConfig: {
    domain: string | null;
    tenantId: string | null;
    outputs: Record<string, unknown>;
  },
  setupSteps: {
    steps: Record<string, StepStatusInfo>;
  },
  modals: {
    googleToken: { isOpen: boolean };
    stepDetails: { isOpen: boolean; step: ManagedStep | null; outputs: Record<string, unknown> };
    stepOutputs: { isOpen: boolean; step: ManagedStep | null; outputs: Record<string, unknown>; allStepsStatus: Record<string, { status: string }> };
  }
}
```

### Modal Management

All modals are managed through Redux, providing:
- Centralized state for all modal visibility
- Type-safe modal data passing
- Consistent open/close patterns
- No prop drilling for modal callbacks

```typescript
// Opening a modal
dispatch(openStepDetailsModal({ step, outputs }));

// Closing a modal
dispatch(closeStepDetailsModal());

// Modal components read state directly
const { isOpen, step, outputs } = useAppSelector(selectStepDetailsModal);
```

### State Persistence

- **AppConfig**: Persisted to localStorage by domain
- **SetupSteps**: Persisted with step progress
- **Modals**: Ephemeral, not persisted

### Best Practices

1. **Never store functions in Redux state** - Use action creators instead
2. **Keep modal data normalized** - Store IDs and look up full objects
3. **Use selectors for computed state** - Don't duplicate data
4. **Handle async operations in server actions** - Keep Redux synchronous

## URL Management System

### Centralized URL Builder (`lib/api/url-builder.ts`)

All URLs in the application are constructed through a centralized system:

```typescript
import { portalUrls, googleDirectoryUrls, microsoftGraphUrls } from "@/lib/api/url-builder";

// Portal URLs for UI navigation
const adminUrl = portalUrls.google.sso.samlProfile(profileFullName);

// API URLs for backend calls
const apiUrl = googleDirectoryUrls.users.get(userEmail);
```

**Key Benefits:**
- No hardcoded URLs in components or API clients
- Automatic URL encoding using native URL and encodeURIComponent
- Environment-specific configuration through env variables
- Type safety for all URL parameters

### Environment Variables

All base URLs are configurable through environment variables:
- API endpoints (`GOOGLE_API_BASE`, `GRAPH_API_BASE`, etc.)
- Portal/Console URLs (`GOOGLE_ADMIN_CONSOLE_BASE`, `AZURE_PORTAL_BASE`)
- Authentication endpoints (`GOOGLE_OAUTH_BASE`, `MICROSOFT_LOGIN_BASE`)

## Error Handling Patterns

### Authentication Errors

Authentication errors are now handled at multiple levels:

1. **API Level**: Detected and wrapped with `AuthenticationError`
2. **Action Level**: Converted to `StepCheckResult` with error metadata
3. **Component Level**: Displayed with clear messaging and action buttons

```typescript
// In server actions
if (isAuthenticationError(error)) {
  return {
    completed: false,
    message: error.message,
    outputs: {
      errorCode: "AUTH_EXPIRED",
      errorProvider: error.provider,
    },
  };
}
```

### API Enablement Errors

Google Cloud API enablement errors are specially handled:
- Enhanced error messages with enable URLs
- Toast notifications with action buttons
- Direct links to enable APIs in Google Cloud Console


# Testing

- ensure `pnpm lint` works

- ensure `pnpm build` works
