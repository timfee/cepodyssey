# Directory Setup Assistant

This Next.js application automates the integration of Google Workspace and Microsoft Entra ID using a step-by-step workflow. It features a React-based frontend, a robust server-action backend, and uses NextAuth.js for dual-provider authentication.

## Architecture Highlights

This project follows modern Next.js App Router conventions:

- **Server Actions**: All backend logic, including API calls, resides in Server Actions (`app/actions/`). These actions are designed to be robust and **never throw exceptions** to the client. Instead, they always return a structured object containing either the successful result or a detailed error.
- **Request-Scoped Logging**: API logging is handled by creating a new logger instance for every server request. This instance is passed down through the function calls to collect a complete trace of the operation, which is then returned to the client for debugging. This avoids the pitfalls of global state in a serverless environment.
- **Client-Side State**: The client uses Redux Toolkit to manage UI state, step progress, and configuration. It reacts to the data returned from Server Actions.
- **Modal-Based Error Handling**: All user-facing errors, especially for authentication, are handled through a global error modal rather than temporary toasts, providing clear and actionable feedback.

## Getting Started

### Prerequisites

- Node.js 20+
- `pnpm` package manager
- A Google Workspace Super Admin account
- A Microsoft Entra ID Global Administrator account

### Environment Setup

1.  **Install Dependencies:**

    ```bash
    pnpm install
    ```

2.  **Create Environment File:**
    Copy the example environment file to create your local configuration:

    ```bash
    cp .env.example .env.local
    ```

3.  **Populate `.env.local`:**
    Fill in the following values from your Google Cloud and Azure App Registrations. **Crucially, the scopes must match exactly** to ensure token refresh and API permissions work correctly.

    ```env
    # NextAuth.js - Generate with: openssl rand -base64 32
    AUTH_SECRET="your_secret_here"

    # Google Workspace
    GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
    GOOGLE_ADMIN_SCOPES="openid email profile https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/admin.directory.orgunit https://www.googleapis.com/auth/admin.directory.domain https://www.googleapis.com/auth/admin.directory.rolemanagement https://www.googleapis.com/auth/cloud-identity"

    # Microsoft Entra ID
    MICROSOFT_CLIENT_ID="YOUR_AZURE_APP_CLIENT_ID"
    MICROSOFT_CLIENT_SECRET="YOUR_AZURE_APP_CLIENT_SECRET"
    MICROSOFT_TENANT_ID="YOUR_AZURE_TENANT_ID"
    MICROSOFT_GRAPH_SCOPES="openid profile email offline_access User.Read Directory.Read.All Application.ReadWrite.All AppRoleAssignment.ReadWrite.All Synchronization.ReadWrite.All"

    # Enable API Debug Panel
    NEXT_PUBLIC_ENABLE_API_DEBUG="true"
    ```

### Running the Application

1.  **Run the development server:**
    ```bash
    pnpm dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.
3.  Sign in with both your Google and Microsoft administrator accounts.
4.  Follow the on-screen steps to configure and execute the automation.

## Development and Testing

- **Linting & Type-Checking**: `pnpm lint` and `pnpm type-check`
- **Build Check**: `pnpm test:build`
- **Runtime Test**: `pnpm test:runtime` (starts server and runs a basic connection test)
- **All Tests**: `pnpm test:all`
