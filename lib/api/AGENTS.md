# AI Agent Instructions for API Wrappers (`lib/api/`)

## Purpose of this Directory

This directory contains strongly-typed wrappers for external APIs (Google Admin SDK, Microsoft Graph). Its purpose is to abstract away raw `fetch` calls and handle API-specific data transformations.

### Core Principles

- **Clarity**: Function names should clearly map to an API endpoint and action (e.g., `getUser`, `createOrgUnit`).
- **Consistency**: All functions must follow the standardized contracts for returning data and handling errors.

---

### Strict Agent Rules

1. **Standardized Return Contracts**:

   - Functions that **GET** a resource (e.g., `getUser`) **MUST** return `Promise<Resource | null>`. Return `null` if the resource is not found (e.g., on a 404 error).
   - Functions that **CREATE** a resource (e.g., `createUser`) **MUST** `throw new AlreadyExistsError()` if the resource already exists (e.g., on a 409 conflict). They must **NOT** return a special object like `{ alreadyExists: true }`.

2. **Logger Parameter**:

   - Every exported function that makes an external network call **MUST** accept an optional `ApiLogger` instance as its last parameter.
   - Example signature: `export async function getUser(token: string, email: string, logger?: ApiLogger)`

3. **Logging API Calls**:
   - Inside the function, before making the `fetch` call, log the action using `logger?.addLog(...)`.
   - The correct method is `addLog`, not `log`.
