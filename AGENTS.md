# Directory Setup Assistant - Agent Guidelines

## Project Overview

This is a Next.js 14 application that automates Google Workspace and Microsoft Entra ID integration through a step-based workflow. It uses TypeScript, NextAuth for dual-provider authentication, and Redux Toolkit for state management.

## Core Architecture Principles

### 1. Step-Based Automation

- All automation is organized into discrete steps with unique IDs (e.g., "G-1", "M-3")
- Each step has `check` and `execute` functions following a standardized interface
- Steps declare dependencies via `requires` array
- Data flows between steps via standardized `OUTPUT_KEYS`

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

## Integration Points

- **Google APIs**: Directory API, Cloud Identity API
- **Microsoft Graph**: Applications, Service Principals, Synchronization
- **NextAuth**: Custom providers with admin verification
- **Redux**: Client state with persistence to localStorage

## Development Workflow

1. Define new steps in `lib/steps.ts` with proper dependencies
2. Implement server actions in `app/actions/`
3. Add UI components following existing patterns
4. Update Redux state and types as needed
5. Test authentication flows and error handling
