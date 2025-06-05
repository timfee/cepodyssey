/**
 * Defines the dynamic status and metadata of a step, typically stored in Redux.
 */
import type { ApiLogger } from "./api/api-logger";
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
  /** Logger instance for capturing API logs during this step */
  logger?: ApiLogger;
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
  // --- Google Workspace Outputs ---
  // G-1: Create 'Automation' OU
  AUTOMATION_OU_PATH: "googleOuPath",
  AUTOMATION_OU_ID: "googleOuId",
  // G-2: Create Provisioning User
  SERVICE_ACCOUNT_EMAIL: "googleUserEmail",
  SERVICE_ACCOUNT_ID: "googleUserId",
  // G-3: Grant Super Admin
  SUPER_ADMIN_ROLE_ID: "googleSuperAdminRoleId",
  // G-4: Verify Domain
  GOOGLE_CUSTOMER_ID: "g4GwsCustomerId",
  // G-5: Initiate Google SAML Profile
  GOOGLE_SAML_PROFILE_NAME: "googleSamlProfileName",
  GOOGLE_SAML_PROFILE_FULL_NAME: "googleSamlProfileFullName",
  GOOGLE_SAML_SP_ENTITY_ID: "googleSamlEntityId",
  GOOGLE_SAML_SP_ACS_URL: "googleSamlAcsUrl",

  // --- Microsoft Entra ID Outputs ---
  // M-1: Create Provisioning App
  PROVISIONING_APP_ID: "msProvAppId",
  PROVISIONING_APP_OBJECT_ID: "msProvAppObjectId",
  PROVISIONING_SP_OBJECT_ID: "msProvSpObjectId",
  // M-2: Enable Provisioning App
  FLAG_M2_PROV_APP_PROPS_CONFIGURED: "msProvAppPropsConfigured",
  // M-3: Authorize Provisioning
  PROVISIONING_JOB_ID: "msProvJobId",
  FLAG_M3_PROV_CREDS_CONFIGURED: "msProvCredsConfigured",
  // M-4: Configure Attribute Mappings
  FLAG_M4_PROV_MAPPINGS_CONFIGURED: "msProvMappingsConfigured",
  // M-6: Create SAML SSO App
  SAML_SSO_APP_ID: "msSamlAppId",
  SAML_SSO_APP_OBJECT_ID: "msSamlAppObjectId",
  SAML_SSO_SP_OBJECT_ID: "msSamlSpObjectId",
  // M-7: Configure SAML App
  FLAG_M7_SAML_APP_SETTINGS_CONFIGURED: "msSamlAppSettingsConfigured",
  // M-8: Retrieve IdP Metadata (from Microsoft, for Google)
  IDP_CERTIFICATE_BASE64: "msIdpCertBase64",
  IDP_SSO_URL: "msIdpSsoUrl",
  IDP_ENTITY_ID: "msIdpEntityId",
  // M-10: Test SSO
  FLAG_M10_SSO_TESTED: "msSsoTested",
};
