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
  GOOGLE_OU_PATH: "googleOuPath",
  GOOGLE_OU_ID: "googleOuId",
  // Google - G-2: Create Provisioning User
  GOOGLE_USER_EMAIL: "googleUserEmail",
  GOOGLE_USER_ID: "googleUserId",
  GOOGLE_USER_PASSWORD: "googleUserPassword",
  // Google - G-3: Grant Admin Privileges to Provisioning User
  GOOGLE_SUPERADMIN_ROLE_ID: "googleSuperAdminRoleId",
  // Google - G-5: Initiate Google SAML Profile
  GOOGLE_SAML_PROFILE_NAME: "googleSamlProfileName",
  GOOGLE_SAML_PROFILE_FULL_NAME: "googleSamlProfileFullName",
  // Google SAML Service Provider config
  GOOGLE_SAML_SP_ENTITY_ID: "googleSamlEntityId",
  GOOGLE_SAML_SP_ACS_URL: "googleSamlAcsUrl",
  // Microsoft - M-1: Create Enterprise App
  MS_APP_ID: "msAppId",
  MS_APP_OBJECT_ID: "msAppObjectId",
  MS_SP_OBJECT_ID: "msSpObjectId",
  // Microsoft - M-3: Authorize Enterprise App
  MS_JOB_ID: "msJobId",
  // Microsoft - M-6: Create SAML SSO App
  MS_SAML_APP_ID: "msSamlAppId",
  MS_SAML_APP_OBJECT_ID: "msSamlAppObjectId",
  MS_SAML_SP_OBJECT_ID: "msSamlSpObjectId",
  // Microsoft - M-8: Retrieve IdP Metadata
  MS_IDP_CERT_BASE64: "msIdpCertBase64",
  MS_IDP_SSO_URL: "msIdpSsoUrl",
  MS_IDP_ENTITY_ID: "msIdpEntityId",
  // Flags for configuration steps
  MS_APP_PROPS_CONFIGURED: "msAppPropsConfigured",
  MS_CREDS_CONFIGURED: "msCredsConfigured",
  MS_MAPPINGS_CONFIGURED: "msMappingsConfigured",
  MS_SAML_APP_SETTINGS_CONFIGURED: "msSamlAppSettingsConfigured",
  MS_SSO_TESTED: "msSsoTested",
};
