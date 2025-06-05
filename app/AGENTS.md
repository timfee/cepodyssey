# App Router (`app/`) Guidelines

This directory contains all routing, page components, and server-side logic entry points for the application.

## Core Concepts

1.  **Server Actions**: The primary method for client-server communication. All server actions are defined in `app/actions/`.

    - **Rule #1: NEVER THROW.** Actions must always catch their own errors and return a structured result object (e.g., `{ success: false, error: { ... } }`). This ensures predictable error handling on the client.
    - **Rule #2: STAY FOCUSED.** Actions are thin wrappers that validate the session and then delegate to the core logic in `/lib/steps/registry.ts`. They should not contain complex business logic themselves.

2.  **Route Protection**: The main page (`/app/page.tsx`) is a Server Component that validates the user's session. If the user is not fully authenticated with both providers, it redirects them to the `/login` page.

3.  **Client-Side Entry Point**: `components/dashboard.tsx` is the main client component (`"use client"`) that orchestrates all user interactions, dispatches actions to Redux, and calls Server Actions.

4.  **Providers**: `app/providers.tsx` wraps the application in all necessary client-side contexts, primarily `SessionProvider` for NextAuth and `ReduxProvider` for Redux. The `GlobalErrorModal` is also rendered here to catch errors from any part of the app.

5.  **Authentication Flow**: The `app/(auth)` route group contains all logic for NextAuth, including the configuration in `auth.ts` and the login page UI in `login/page.tsx`. Admin role verification happens in the `signIn` callback of the NextAuth configuration.
