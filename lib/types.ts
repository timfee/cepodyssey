/**
 * Defines the dynamic status and metadata of a step, typically stored in Redux.
 */
export interface StepStatusInfo {
  status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
  completionType?: "server-verified" | "user-marked";
  error?: string | null;
  message?: string;
  /** Timestamp of the most recent check run */
  lastCheckedAt?: string;
  metadata?: {
    completedAt?: string;
    preExisting?: boolean;
    resourceUrl?: string;
    errorDetails?: unknown;
    [key: string]: unknown;
  };
}

/**
 * Represents the overall application configuration state, managed in Redux.
 */
export interface AppConfigState {
  domain: string | null;
  tenantId: string | null;
  outputs: Record<string, unknown>;
}

/**
 * Defines the structure for results from `check` functions (server actions).
 */
export interface StepCheckResult {
  completed: boolean;
  message?: string;
  outputs?: Record<string, unknown>;
  apiLogs?: Array<{
    id: string;
    timestamp: string;
    method: string;
    url: string;
    headers?: Record<string, string>;
    requestBody?: unknown;
    responseStatus?: number;
    responseBody?: unknown;
    error?: string;
    duration?: number;
    provider?: "google" | "microsoft" | "other";
  }>;
}

/**
 * Defines the standardized structure for results from `execute` functions (server actions).
 */
export interface StepExecutionResult {
  success: boolean;
  message?: string;
  resourceUrl?: string;
  outputs?: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
  };
  apiLogs?: Array<{
    id: string;
    timestamp: string;
    method: string;
    url: string;
    headers?: Record<string, string>;
    requestBody?: unknown;
    responseStatus?: number;
    responseBody?: unknown;
    error?: string;
    duration?: number;
    provider?: "google" | "microsoft" | "other";
  }>;
}

export interface StepInput {
  type: "keyValue" | "stepCompletion";
  data: {
    key?: string;
    value?: unknown;
    description?: string;
    stepId?: string; // For stepCompletion type
    producedBy?: string; // Step that produces this value
  };
  stepTitle?: string; // Human readable title of the required step
}

export interface StepOutput {
  key: string;
  value?: unknown;
  description?: string;
}

/**
 * Provides context (current config and outputs from previous steps)
 * from the frontend to the check/execute lambdas in lib/steps/,
 * which then pass it to server actions.
 */
export interface StepContext {
  domain: string;
  tenantId: string;
  outputs: Record<string, unknown>;
  inputs?: StepInput[];
  producedOutputs?: StepOutput[];
}

/**
 * Defines the static properties of a single automation step.
 */
export interface StepDefinition {
  // Core identification
  id: string;
  title: string;
  description: string; // One sentence, human readable
  details: string; // 2-3 short sentences, technical details

  // Categorization
  category: "Google" | "Microsoft" | "SSO";
  activity: "Provisioning" | "SSO" | "Foundation";
  provider: "Google" | "Microsoft";

  // Execution characteristics
  automatability: "automated" | "supervised" | "manual";
  automatable: boolean; // Keep for backward compatibility, derive from automatability

  // Dependencies and flow
  requires?: string[];
  inputs?: StepInput[];
  outputs?: StepOutput[];
  nextStep?: {
    id: string;
    description: string;
  };

  // Technical implementation
  actions?: string[]; // API calls that will be performed

  // Resource links
  adminUrls?: {
    configure?:
      | string
      | ((outputs: Record<string, unknown>) => string | null | undefined);
    verify?:
      | string
      | ((outputs: Record<string, unknown>) => string | null | undefined);
  };

  // Server functions
  check?: (context: StepContext) => Promise<StepCheckResult>;
  execute?: (context: StepContext) => Promise<StepExecutionResult>;
}

/**
 * A fully managed step object, combining static definition with dynamic status,
 * used for rendering in the UI.
 */
export type ManagedStep = StepDefinition & StepStatusInfo;

/**
 * Defines standardized keys for accessing specific data within the `outputs`
 * object shared between steps. Prefixes (e.g., g1, m1) indicate the step
 * that typically produces this output.
 */
export const OUTPUT_KEYS = {
  // Google - G-1: Create 'Automation' Organizational Unit
  AUTOMATION_OU_PATH: "g1AutomationOuPath",
  AUTOMATION_OU_ID: "g1AutomationOuId",
  // Google - G-2: Create Provisioning User
  SERVICE_ACCOUNT_EMAIL: "g2ServiceAccountEmail",
  SERVICE_ACCOUNT_ID: "g2ServiceAccountId",
  SERVICE_ACCOUNT_PASSWORD: "g2ServiceAccountPassword",
  // Google - G-3: Grant Admin Privileges to Provisioning User
  SUPER_ADMIN_ROLE_ID: "g3SuperAdminRoleId",
  // Google - G-5: Initiate Google SAML Profile
  GOOGLE_SAML_PROFILE_NAME: "g5GoogleSsoProfileName",
  GOOGLE_SAML_PROFILE_FULL_NAME: "g5GoogleSsoProfileFullName",
  // Google SAML Service Provider config
  GOOGLE_SAML_SP_ENTITY_ID: "g5GoogleSamlSpEntityId",
  GOOGLE_SAML_ACS_URL: "g5GoogleSamlAcsUrl",

  // Microsoft - M-1: Create Provisioning App
  PROVISIONING_APP_ID: "m1ProvisioningAppId",
  PROVISIONING_APP_OBJECT_ID: "m1ProvisioningAppObjectId",
  PROVISIONING_SP_OBJECT_ID: "m1ProvisioningSpObjectId",

  // Microsoft - M-3: Authorize Provisioning Connection
  PROVISIONING_JOB_ID: "m3ProvisioningJobId",

  // Microsoft - M-6: Create SAML SSO App
  SAML_SSO_APP_ID: "m6SamlSsoAppId",
  SAML_SSO_APP_OBJECT_ID: "m6SamlSsoAppObjectId",
  SAML_SSO_SP_OBJECT_ID: "m6SamlSsoSpObjectId",

  // Microsoft - M-8: Retrieve IdP Metadata
  IDP_CERTIFICATE_BASE64: "m8IdpCertificateBase64",
  IDP_SSO_URL: "m8IdpSsoUrl",
  IDP_ENTITY_ID: "m8IdpEntityId",

  // Flags for configuration steps
  FLAG_M2_PROV_APP_PROPS_CONFIGURED: "flagM2ProvAppPropsConfigured",
  FLAG_M3_PROV_CREDS_CONFIGURED: "flagM3ProvCredsConfigured",
  FLAG_M4_PROV_MAPPINGS_CONFIGURED: "flagM4ProvMappingsConfigured",
  FLAG_M7_SAML_APP_SETTINGS_CONFIGURED: "flagM7SamlAppSettingsConfigured",
  FLAG_M10_SSO_TESTED: "flagM10SsoTested",
};
