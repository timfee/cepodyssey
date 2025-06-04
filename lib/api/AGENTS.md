# API Contracts and Integration Guidelines

## Overview

This document describes the API contracts and integration patterns used in the Directory Setup Assistant for automating Google Workspace and Microsoft Entra ID integration.

## Google Workspace APIs

### Directory API

**Base URL**: `https://admin.googleapis.com/admin/directory/v1`
**Authentication**: OAuth 2.0 Bearer Token with admin scopes

#### Key Endpoints

- `GET/POST /customer/{customerId}/orgunits` - Manage organizational units
- `GET/POST /users` - Manage users
- `GET/POST /customer/{customerId}/domains` - Manage domains
- `GET/POST /customer/{customerId}/roles` - Manage admin roles

#### Required Scopes

```
https://www.googleapis.com/auth/admin.directory.orgunit
https://www.googleapis.com/auth/admin.directory.user
https://www.googleapis.com/auth/admin.directory.domain
https://www.googleapis.com/auth/admin.directory.rolemanagement
```

### Cloud Identity API

**Base URL**: `https://cloudidentity.googleapis.com/v1`
**Authentication**: OAuth 2.0 Bearer Token

#### Key Endpoints

- `GET/POST /inboundSamlSsoProfiles` - Manage SAML SSO profiles
- `POST /{profileName}:assignToOrgUnits` - Assign SAML profiles to OUs

#### Important Notes

- Customer ID is typically "my_customer" for the authenticated admin's domain
- SAML profile names follow format: `inboundSamlSsoProfiles/{profileId}`
- Automated user provisioning setup with Azure AD's gallery app involves an OAuth consent flow initiated from Azure, using a dedicated Google admin user. This tool guides that manual authorization step (M-3) rather than directly handling a Google-side provisioning token for it.

## Microsoft Graph API

### Base Configuration

**Base URL**: `https://graph.microsoft.com/v1.0`
**Authentication**: OAuth 2.0 Bearer Token

### Application Management

#### App Registration vs Enterprise Application

- **App Registration**: The application object (`/applications`)
- **Enterprise Application**: The service principal (`/servicePrincipals`)
- Gallery apps create both objects simultaneously

#### Key Endpoints

- `POST /applicationTemplates/{templateId}/instantiate` - Create gallery app
- `GET/PATCH /applications/{id}` - Manage app registrations
- `GET/PATCH /servicePrincipals/{id}` - Manage enterprise apps
- `POST /servicePrincipals/{id}/synchronization/jobs` - Create provisioning job

### Provisioning Configuration

#### Synchronization Jobs

```typescript
interface SynchronizationJob {
  id: string;
  templateId: "GoogleApps"; // For Google Workspace provisioning
  status: {
    state: "Active" | "Paused" | "Disabled";
  };
  synchronizationJobSettings: Array<{
    name: string;
    value: string;
  }>;
}
```

#### Required Credentials

```typescript
[
  // This OAuth token is obtained by Azure AD after an administrator completes
  // the consent flow from the enterprise app's provisioning settings using the
  // dedicated Google provisioning user (e.g., azuread-provisioning@<your-domain>).
  { key: "SecretToken", value: "<Google_OAuth_Token>" },
  {
    key: "BaseAddress",
    value: "https://www.googleapis.com/admin/directory/v1.12/scim",
  },
];
```

### SAML Configuration

#### Metadata Endpoint

```
GET https://login.microsoftonline.com/{tenantId}/federationmetadata/2007-06/federationmetadata.xml?appid={appId}
```

#### Required App Configuration

```typescript
{
  identifierUris: ["<Google_SP_Entity_ID>", "https://<domain>"],
  web: {
    redirectUris: ["<Google_ACS_URL>"],
    implicitGrantSettings: {
      enableIdTokenIssuance: false,
      enableAccessTokenIssuance: false
    }
  }
}
```

## Data Flow Between Systems

### Step Output Keys (Constants)

All data exchange between steps uses predefined output keys:

```typescript
OUTPUT_KEYS = {
  // Google Outputs
  AUTOMATION_OU_ID: "g1AutomationOuId",
  GOOGLE_SAML_SP_ENTITY_ID: "g5GoogleSamlSpEntityId",
  GOOGLE_SAML_ACS_URL: "g5GoogleSamlAcsUrl",

  // Microsoft Outputs
  PROVISIONING_APP_ID: "m1ProvisioningAppId",
  PROVISIONING_SP_OBJECT_ID: "m1ProvisioningSpObjectId",
  SAML_SSO_APP_ID: "m6SamlSsoAppId",

  // Cross-System Outputs
  IDP_ENTITY_ID: "m8IdpEntityId",
  IDP_SSO_URL: "m8IdpSsoUrl",
  IDP_CERTIFICATE_BASE64: "m8IdpCertificateBase64",
};
```

### Critical Integration Points

1. **Google → Azure**:

   - SP Entity ID and ACS URL from Google SAML profile
   - Authorization for provisioning: achieved via manual OAuth consent in the Azure Portal using the dedicated Google admin user (step M-3)

2. **Azure → Google**:
   - IdP metadata (Entity ID, SSO URL, Certificate)
   - User provisioning via SCIM protocol

## Error Handling Patterns

### API Error Class

```typescript
class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  )
}
```

### Retry Logic

- Exponential backoff for 5xx errors
- No retry for 4xx errors (except 429)
- Max 3 retries with increasing delays

### Conflict Resolution

- 409 responses return `{ alreadyExists: true }`
- Idempotent operations continue without error
- Resource existence is verified before creation

## Security Considerations

1. **Token Management**:

   - Tokens are never stored in Redux state
   - Server-only actions handle all API calls
   - Automatic token refresh via NextAuth

2. **Scope Limitations**:

   - Request minimum required scopes
   - Admin privileges verified during sign-in
   - Separate apps for provisioning and SSO

3. **Data Validation**:
   - Domain format: `/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i`
   - Tenant ID: Valid UUID format
   - All inputs sanitized before API calls

## Known Limitations

1. **Google Workspace**:

   - Cannot automate provisioning token retrieval
   - Domain verification requires DNS changes
   - SAML profile assignment is OU-based, not granular

2. **Microsoft Entra ID**:

   - Gallery app templates have fixed configurations
   - Provisioning scope must be set manually
   - User assignments require manual intervention

3. **Cross-Platform**:
   - No real-time sync status from Google's side
   - SAML testing requires actual user accounts
   - Rollback capabilities are limited

## Portal URL Patterns

### Azure Portal Deep Links

```
# App Registration View
https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/{appId}/isMSAApp~/false

# Enterprise Application View
https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/servicePrincipalId/{spId}/appId/{appId}

# Provisioning Configuration
https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/ProvisioningManagement/appId/{appId}/objectId/{spId}

# SAML Configuration
https://portal.azure.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/SingleSignOn/appId/{appId}/objectId/{spId}
```

### Google Admin Console Links

```
# Organizational Units
https://admin.google.com/ac/orgunits

# Domain Management
https://admin.google.com/ac/domains/manage

# SAML/SSO Configuration
https://admin.google.com/ac/sso

# SCIM Provisioning Settings
https://admin.google.com/ac/apps/unified#/settings/scim
```
