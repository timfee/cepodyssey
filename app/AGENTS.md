# App Router Guidelines

## Structure Overview

This follows Next.js 14 App Router conventions with a clear separation between authentication routes and the main application.

```
app/
├── (auth)/           # Authentication group route
│   ├── auth.ts      # NextAuth configuration
│   ├── api/auth/    # NextAuth API routes
│   └── login/       # Login page and actions
├── actions/         # Server actions (backend logic)
├── globals.css      # Global styles with Tailwind
├── layout.tsx       # Root layout with providers
├── page.tsx         # Main dashboard (protected)
└── providers.tsx    # Client-side providers wrapper
```

## Server Actions Pattern

### File Organization

- `auth-actions.ts`: Authentication utilities (tenant lookup)
- `check-actions.ts`: Step verification functions
- `config-actions.ts`: Configuration persistence
- `execution-actions.ts`: Step execution logic

### Server Action Standards

```typescript
"use server";

import { auth } from "@/app/(auth)/auth";

// Always include error handling
async function handleExecutionError(
  error: unknown,
  stepId?: string,
): Promise<StepExecutionResult> {
  console.error(
    `Execution Action Failed (Step ${stepId || "Unknown"}):`,
    error,
  );
  if (error instanceof APIError) {
    return {
      success: false,
      error: { message: error.message, code: error.code },
    };
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  return { success: false, error: { message } };
}

// Use consistent token retrieval
async function getTokens(): Promise<{
  googleToken: string;
  microsoftToken: string;
  tenantId: string;
}> {
  const session = await auth();
  if (!session?.googleToken) throw new APIError("Google auth required", 401);
  if (!session?.microsoftToken)
    throw new APIError("Microsoft auth required", 401);
  return {
    googleToken: session.googleToken,
    microsoftToken: session.microsoftToken,
    tenantId: session.microsoftTenantId,
  };
}
```

### Authentication Integration

- Use `auth()` from NextAuth for session access in Server Actions
- Validate required tokens before API calls
- Return standardized error codes for missing authentication
- Never access tokens directly in Client Components

## Route Protection

- Main page (`/`) requires both Google and Microsoft authentication
- Login page handles missing authentication states
- Automatic redirects based on authentication status
- Use `redirect()` from `next/navigation` for navigation

## App Router Specifics

- Server Components are default (no "use client" needed)
- Client Components must have "use client" directive
- Use `useRouter` from `next/navigation` (not `next/router`)
- Forms use Server Actions, not traditional form submission

## Key Patterns

- Server actions handle all external API calls
- Client components focus on UI state and user interaction
- Configuration flows from session → Redux → server actions
- Error boundaries catch and display React errors appropriately
