# Directory Setup Assistant

This Next.js application automates connecting Google Workspace and Microsoft Entra ID.  It uses **NextAuth** for authentication and a small Redux store to track configuration and step progress.

## Project Structure

- **app/** – Next.js routes and server actions.
- **components/** – React components for the UI.
- **hooks/** – Custom hooks, including typed Redux helpers.
- **lib/** – API wrappers, Redux slices and utility functions.

Automation steps are defined in `lib/steps.ts` and executed through server actions in `app/actions`.

## Development

1. Install dependencies with `pnpm install`.
2. Copy `.env.local` and provide credentials (see below).
3. Run `pnpm dev` to start the dev server.

### Google OAuth Setup

This app requests admin level scopes from Google Workspace.  Because these scopes are sensitive, the OAuth consent screen must be set to **Internal** (only users in your Workspace) or placed in a published testing mode.  Create credentials for a Web application and set the callback URL to `http://localhost:3000/api/auth/callback/google`.

Set the following environment variables:

```
GOOGLE_CLIENT_ID=<your id>
GOOGLE_CLIENT_SECRET=<your secret>
GOOGLE_ADMIN_SCOPES="openid email profile https://www.googleapis.com/auth/admin.directory.user ..."
GOOGLE_API_BASE=https://admin.googleapis.com
GOOGLE_IDENTITY_BASE=https://cloudidentity.googleapis.com
```

### Microsoft OAuth Setup

Create an app registration in Azure AD with the redirect URL `http://localhost:3000/api/auth/callback/microsoft-entra-id`.  Grant the Microsoft Graph scopes used in `.env.local` and enable the `Allow public client flows` option if needed.

Environment variables:

```
MICROSOFT_CLIENT_ID=<your id>
MICROSOFT_CLIENT_SECRET=<your secret>
MICROSOFT_TENANT_ID=<tenant id>
MICROSOFT_GRAPH_SCOPES="openid profile email offline_access User.Read ..."
GRAPH_API_BASE=https://graph.microsoft.com/v1.0
```

## Running

Once both providers are configured you can sign in with accounts that have administrator permissions in each service.  The dashboard will then guide you through the integration steps.
