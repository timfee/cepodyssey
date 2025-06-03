/**
 * Defines the dynamic status and metadata of a step, typically stored in Redux.
 */
export interface StepStatusInfo {
  status: "pending" | "in_progress" | "completed" | "failed";
  error?: string | null;
  message?: string;
  metadata?: {
    completedAt?: string;
    preExisting?: boolean;
    resourceUrl?: string;
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
}

/**
 * Provides context (current config and outputs from previous steps)
 * from the frontend to the check/execute lambdas in lib/steps.ts,
 * which then pass it to server actions.
 */
export interface StepContext {
  domain: string;
  tenantId: string;
  outputs: Record<string, unknown>;
}

/**
 * Defines the static and functional properties of a single automation step.
 */
export interface StepDefinition {
  id: string;
  title: string;
  description: string;
  category: "Google" | "Microsoft" | "SSO";
  automatable: boolean;
  requires?: string[];
  check?: (context: StepContext) => Promise<StepCheckResult>;
  execute: (context: StepContext) => Promise<StepExecutionResult>;
  /**
   * Optional deep links to relevant admin console locations. These may be
   * provided as static strings or as functions that derive URLs from any
   * previously captured step outputs.
   */
  adminUrls?: {
    configure?:
      | string
      | ((outputs: Record<string, unknown>) => string | null | undefined);
    verify?:
      | string
      | ((outputs: Record<string, unknown>) => string | null | undefined);
  };
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
  // Google - G-1: Create Automation OU
  AUTOMATION_OU_PATH: "g1AutomationOuPath",
  AUTOMATION_OU_ID: "g1AutomationOuId",
  // Google - G-S0: Get Secret Token for Provisioning
  GOOGLE_PROVISIONING_SECRET_TOKEN: "gs0GoogleProvisioningSecretToken",
  // Google - G-5: Initiate Google SAML Profile
  GOOGLE_SAML_PROFILE_NAME: "g5GoogleSsoProfileName",
  GOOGLE_SAML_PROFILE_FULL_NAME: "g5GoogleSsoProfileFullName",
  GOOGLE_SAML_SP_ENTITY_ID: "g5GoogleSamlSpEntityId",
  GOOGLE_SAML_ACS_URL: "g5GoogleSamlAcsUrl",
  // Microsoft - M-1: Create Provisioning App
  PROVISIONING_APP_ID: "m1ProvisioningAppId", // App (Client) ID
  PROVISIONING_APP_OBJECT_ID: "m1ProvisioningAppObjectId", // Application Object ID
  PROVISIONING_SP_OBJECT_ID: "m1ProvisioningSpObjectId", // Service Principal Object ID
  // Microsoft - M-3: Authorize Provisioning Connection
  PROVISIONING_JOB_ID: "m3ProvisioningJobId",
  // Microsoft - M-6: Create SAML SSO App
  SAML_SSO_APP_ID: "m6SamlSsoAppId", // App (Client) ID
  SAML_SSO_APP_OBJECT_ID: "m6SamlSsoAppObjectId", // Application Object ID
  SAML_SSO_SP_OBJECT_ID: "m6SamlSsoSpObjectId", // Service Principal Object ID
  // Microsoft - M-8: Retrieve Azure IdP Metadata
  IDP_CERTIFICATE_BASE64: "m8IdpCertificateBase64",
  IDP_SSO_URL: "m8IdpSsoUrl",
  IDP_ENTITY_ID: "m8IdpEntityId",
  // Flags set by execution steps to indicate completion of complex configurations
  FLAG_M2_PROV_APP_PROPS_CONFIGURED: "flagM2ProvAppPropsConfigured",
  FLAG_M3_PROV_CREDS_CONFIGURED: "flagM3ProvCredsConfigured",
  FLAG_M4_PROV_MAPPINGS_CONFIGURED: "flagM4ProvMappingsConfigured",
  FLAG_M7_SAML_APP_SETTINGS_CONFIGURED: "flagM7SamlAppSettingsConfigured",
};
