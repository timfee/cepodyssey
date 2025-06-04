# Directory Setup Assistant

This Next.js application automates connecting Google Workspace and Microsoft Entra ID. It uses **NextAuth** for authentication and a small Redux store to track configuration and step progress.

## Project Structure

- **app/** – Next.js routes and server actions.
- **components/** – React components for the UI.
- **hooks/** – Custom hooks, including typed Redux helpers.
- **lib/** – API wrappers, Redux slices and utility functions.

Automation steps live in `lib/steps/` as self-contained modules with `check.ts` and `execute.ts` implementations. Server actions simply delegate to these modules via the step registry.

## Workflow Overview

This project automates the provisioning and single sign-on setup between
Google Workspace (or Cloud Identity) and Microsoft Entra ID. It follows the
[Google federation guide](https://cloud.google.com/architecture/identity/federating-gcp-with-azure-active-directory)
and replicates the manual workflow in discrete steps:

1. **Prepare Cloud Identity**
   - Create an `Automation` organizational unit and a user named
     `azuread-provisioning`.
   - Grant that user either super-admin privileges or a delegated admin role
     with `Users`, `Groups`, and `Organization Units` permissions.
   - Register and verify all domains used for user and group email addresses.
2. **Configure Microsoft Entra ID provisioning**

   - Add the _Google Cloud/G Suite Connector by Microsoft_ gallery app as
     `Google Cloud (Provisioning)`.
   - Authorize the app in the Azure portal using OAuth consent with the
     `azuread-provisioning` account (step M-3 provides guidance for this
     manual authorization process).
   - Adjust the attribute mappings for users and groups.
   - Optionally assign specific users or groups and then enable automatic
     provisioning.

3. **Set up single sign-on**
   - Create a SAML profile in the Admin Console named `Entra ID`.
   - Add a second enterprise application called `Google Cloud` and configure its
     SAML settings using the Entity ID and ACS URL from the profile.
   - Upload the Microsoft Entra ID signing certificate and assign the profile to
     the appropriate organizational units.

After these steps, Entra ID users can sign in to Google Cloud resources and are
provisioned automatically. The Directory Setup Assistant breaks this workflow
into idempotent steps so the process can be run multiple times.

## Development

1. Install dependencies with `pnpm install`.
2. Copy `.env.local` and provide credentials (see below).
3. Run `pnpm dev` to start the dev server.

### Environment Variables

`.env.local` should define the following keys:

```env
# Authentication
AUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Google OAuth Configuration
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_ADMIN_SCOPES="openid email profile https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/admin.directory.orgunit https://www.googleapis.com/auth/admin.directory.domain https://www.googleapis.com/auth/admin.directory.rolemanagement https://www.googleapis.com/auth/cloud-identity.inboundsso"

# Google API Endpoints
GOOGLE_API_BASE=https://admin.googleapis.com
GOOGLE_IDENTITY_BASE=https://cloudidentity.googleapis.com
GOOGLE_OAUTH_BASE=https://oauth2.googleapis.com
GOOGLE_ADMIN_CONSOLE_BASE=https://admin.google.com

# Microsoft OAuth Configuration
MICROSOFT_CLIENT_ID=<your-client-id>
MICROSOFT_CLIENT_SECRET=<your-client-secret>
MICROSOFT_TENANT_ID=<your-tenant-id>
NEXT_PUBLIC_MICROSOFT_TENANT_ID=<your-tenant-id>
MICROSOFT_GRAPH_SCOPES="openid profile email offline_access User.Read Directory.Read.All Application.ReadWrite.All AppRoleAssignment.ReadWrite.All Synchronization.ReadWrite.All"

# Microsoft API Endpoints
GRAPH_API_BASE=https://graph.microsoft.com/v1.0
MICROSOFT_LOGIN_BASE=https://login.microsoftonline.com
AZURE_PORTAL_BASE=https://portal.azure.com
```

### Logging Configuration

```env
NEXT_PUBLIC_LOG_LEVEL=info
NEXT_PUBLIC_LOG_TO_CONSOLE=true
NEXT_PUBLIC_LOG_LEVEL_TO_SHOW_IN_TOASTS=1
```

Note: `NEXT_PUBLIC_MICROSOFT_TENANT_ID` can be set to pre-fill the tenant field on the login page.

### Google OAuth Setup

This app requests admin level scopes from Google Workspace. Because these scopes are sensitive, the OAuth consent screen must be set to **Internal** (only users in your Workspace) or placed in a published testing mode. Create credentials for a Web application and set the callback URL to `http://localhost:3000/api/auth/callback/google`.

Set the following environment variables:

```
GOOGLE_CLIENT_ID=<your id>
GOOGLE_CLIENT_SECRET=<your secret>
GOOGLE_ADMIN_SCOPES="openid email profile https://www.googleapis.com/auth/admin.directory.user https://www.googleapis.com/auth/admin.directory.group https://www.googleapis.com/auth/admin.directory.orgunit https://www.googleapis.com/auth/admin.directory.domain https://www.googleapis.com/auth/admin.directory.rolemanagement https://www.googleapis.com/auth/cloud-identity.inbound-sso"
GOOGLE_API_BASE=https://admin.googleapis.com
GOOGLE_IDENTITY_BASE=https://cloudidentity.googleapis.com
```

### Microsoft OAuth Setup

Create an app registration in Azure AD with the redirect URL `http://localhost:3000/api/auth/callback/microsoft-entra-id`. Grant the Microsoft Graph scopes used in `.env.local` and enable the `Allow public client flows` option if needed.

Environment variables:

```
MICROSOFT_CLIENT_ID=<your id>
MICROSOFT_CLIENT_SECRET=<your secret>
MICROSOFT_TENANT_ID=<tenant id>
MICROSOFT_GRAPH_SCOPES="openid profile email offline_access User.Read ..."
GRAPH_API_BASE=https://graph.microsoft.com/v1.0
```

## Running

Once both providers are configured you can sign in with accounts that have administrator permissions in each service. The dashboard will then guide you through the integration steps.

## Google Cloud Project Setup

Before using this tool, ensure these APIs are enabled in your Google Cloud project:

1. **Admin SDK API** - Required for Google Workspace directory operations

   - Enable at: https://console.cloud.google.com/apis/library/admin.googleapis.com

2. **Cloud Identity API** - Required for SAML SSO configuration
   - Enable at: https://console.cloud.google.com/apis/library/cloudidentity.googleapis.com

To find your project ID:

1. Go to https://console.cloud.google.com
2. Select your project from the dropdown
3. The project ID is shown in the project info card

### Common Setup Issues

- **"API has not been used in project X before"**: Enable the mentioned API using the link in the error message
- **"Request had insufficient authentication scopes"**: Re-authenticate after updating scopes in your environment
- **403 Forbidden errors**: Ensure the signed-in admin or the `azuread-provisioning` service user has sufficient rights
- **Problems creating the Automation OU or user**: Verify the Google account has privileges to manage organizational units and users

### URL Configuration

This application uses a centralized URL builder system (`lib/api/url-builder.ts`) that:

- Handles all URL encoding automatically
- Uses environment variables for base URLs
- Provides type-safe URL construction
- Supports different environments (dev/staging/prod)

All external URLs are constructed through this system, ensuring consistency and proper encoding across the application.

### Enhanced UI Features

The dashboard now features enhanced step cards that display:

- **Input Requirements**: Shows which outputs from other steps are required
- **Output Generation**: Displays what data this step will produce
- **Real-time Status**: Visual indicators for pending, in-progress, completed, and failed states
- **Direct Resource Links**: Quick access to created resources in admin consoles
- **Detailed Error Information**: Expandable sections showing error details and resolution steps

### Authentication Error Handling

Errors are displayed through a centralized error dialog managed by Redux:

- Automatic detection of expired tokens
- Modal dialog with a sign-in action when authentication expires
- API enablement errors show an "Enable API" button
- Other errors include diagnostic details and can be dismissed
- Session persistence across token refreshes

### Error Handling

All errors are surfaced through a single global modal. Dispatch `setError` with a message and optional details to the Redux store and the modal will appear. Avoid using toast notifications for errors.

### Google API Integration

The Google `customerId` is fetched during the domain verification step and stored in `outputs['G-4'].customerId`. Subsequent Google API calls should use this value instead of the placeholder `my_customer`.

## Testing

Run `pnpm lint` to check code formatting and `pnpm build` to create a production build.
