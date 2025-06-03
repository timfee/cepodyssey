"use server";

import {
  executeG1CreateAutomationOu,
  executeG2CreateServiceAccount,
  executeG3GrantAdminPrivileges,
  executeG4AddAndVerifyDomain,
  executeG5InitiateGoogleSamlProfile,
  executeG6UpdateGoogleSamlWithAzureIdp,
  executeG7AssignGoogleSamlToRootOu,
  executeG8ExcludeAutomationOuFromSso,
  executeM1CreateProvisioningApp,
  executeM2ConfigureProvisioningAppProperties,
  executeM3AuthorizeProvisioningConnection,
  executeM4ConfigureProvisioningAttributeMappings,
  executeM5StartProvisioningJob,
  executeM6CreateSamlSsoApp,
  executeM7ConfigureAzureSamlAppSettings,
  executeM8RetrieveAzureIdpMetadata,
  executeM9AssignUsersToAzureSsoApp,
} from "./execution-actions";

import {
  checkOrgUnitExists,
  checkDomainVerified,
  checkGoogleSamlProfileDetails,
  checkMicrosoftServicePrincipal,
  checkServiceAccountExists,
  checkServiceAccountIsAdmin,
  checkMicrosoftServicePrincipalEnabled,
  checkMicrosoftProvisioningJobDetails,
  checkMicrosoftAttributeMappingsApplied,
  checkMicrosoftSamlAppSettingsApplied,
  checkMicrosoftAppAssignments,
} from "./check-actions";

import type { StepContext, StepCheckResult, StepExecutionResult } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";

const STEP_REGISTRY = {
  "G-1": {
    check: async (_context: StepContext) => checkOrgUnitExists("/Automation"),
    execute: async (context: StepContext) => executeG1CreateAutomationOu(context),
  },

  "G-2": {
    check: async (context: StepContext) => {
      const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
      if (!email) return { completed: false, message: "Service account not yet created." };
      return checkServiceAccountExists(email);
    },
    execute: async (context: StepContext) => executeG2CreateServiceAccount(context),
  },

  "G-3": {
    check: async (context: StepContext) => {
      const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
      if (!email) return { completed: false, message: "Service account email not found." };
      return checkServiceAccountIsAdmin(email);
    },
    execute: async (context: StepContext) => executeG3GrantAdminPrivileges(context),
  },

  "G-S0": {
    check: async (context: StepContext) => {
      return context.outputs[OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN]
        ? { completed: true, message: "Secret Token is stored." }
        : { completed: false, message: "Secret Token needed." };
    },
    execute: async (_context: StepContext) => ({
      success: true,
      message:
        "To get the Google Secret Token for provisioning:\n\n" +
        "1. Sign in to Google Admin Console (admin.google.com)\n" +
        "2. Navigate to: Apps > Web and mobile apps\n" +
        "3. Click 'Add app' > 'Add custom SAML app'\n" +
        "4. Enter a temporary name (e.g., 'Azure AD Provisioning Setup')\n" +
        "5. On 'Google Identity Provider details', click 'Continue'\n" +
        "6. On 'Service provider details', click 'Continue'\n" +
        "7. On 'Attribute mapping', click 'Continue'\n" +
        "8. On the final page, look for 'Automatic user provisioning' section\n" +
        "9. Click 'SET UP AUTOMATIC USER PROVISIONING'\n" +
        "10. Copy the 'Authorization token' value - this is your Secret Token\n" +
        "11. Save this token securely - you'll need it for step M-3\n\n" +
        "Note: The app you create here is temporary. The actual SSO will be configured later.",
      resourceUrl: "https://admin.google.com/ac/apps/unified",
    }),
  },

  "G-4": {
    check: async (context: StepContext) => {
      if (!context.domain) return { completed: false, message: "Domain not configured." };
      return checkDomainVerified(context.domain);
    },
    execute: async (context: StepContext) => executeG4AddAndVerifyDomain(context),
  },

  "G-5": {
    check: async (_context: StepContext) =>
      checkGoogleSamlProfileDetails("Azure AD SSO", true, undefined),
    execute: async (context: StepContext) => executeG5InitiateGoogleSamlProfile(context),
  },

  "G-6": {
    check: async (context: StepContext) => {
      const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
      const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
      if (!profileName || !idpEntityId) {
        return { completed: false, message: "Missing required configuration." };
      }
      return checkGoogleSamlProfileDetails(profileName, false, idpEntityId);
    },
    execute: async (context: StepContext) => executeG6UpdateGoogleSamlWithAzureIdp(context),
  },

  "G-7": {
    check: async (context: StepContext) => {
      const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
      if (!profileName) return { completed: false, message: "SAML profile name not found." };
      const result = await checkGoogleSamlProfileDetails(profileName, false, undefined);
      if (result.completed && result.outputs?.ssoMode === "SAML_SSO_ENABLED") {
        return { completed: true, message: "SAML profile is enabled and assigned." };
      }
      return { completed: false, message: "SAML profile not enabled or assigned." };
    },
    execute: async (context: StepContext) => executeG7AssignGoogleSamlToRootOu(context),
  },

  "G-8": {
    check: async (context: StepContext) => {
      const automationOuId = context.outputs[OUTPUT_KEYS.AUTOMATION_OU_ID] as string;
      if (!automationOuId) return { completed: true, message: "No Automation OU to exclude." };
      return { completed: false, message: "Check not implemented for OU exclusion." };
    },
    execute: async (context: StepContext) => executeG8ExcludeAutomationOuFromSso(context),
  },

  "M-1": {
    check: async (context: StepContext) => {
      const appId = context.outputs[OUTPUT_KEYS.PROVISIONING_APP_ID] as string;
      if (!appId) return { completed: false, message: "Provisioning App ID not found." };
      const result = await checkMicrosoftServicePrincipal(appId);
      if (result.completed && result.outputs) {
        return {
          ...result,
          outputs: {
            [OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID]: result.outputs.spId,
            [OUTPUT_KEYS.PROVISIONING_APP_ID]: result.outputs.retrievedAppId,
            [OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID]: result.outputs.appObjectId,
          }
        };
      }
      return result;
    },
    execute: async (context: StepContext) => executeM1CreateProvisioningApp(context),
  },

  "M-2": {
    check: async (context: StepContext) => {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      if (!spId) return { completed: false, message: "Service Principal ID not found." };
      return checkMicrosoftServicePrincipalEnabled(spId);
    },
    execute: async (context: StepContext) => executeM2ConfigureProvisioningAppProperties(context),
  },

  "M-3": {
    check: async (context: StepContext) => {
      if (!context.outputs[OUTPUT_KEYS.GOOGLE_PROVISIONING_SECRET_TOKEN]) {
        return { completed: false, message: "Google Secret Token not provided." };
      }
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
      if (!spId) return { completed: false, message: "Service Principal ID not found." };
      return checkMicrosoftProvisioningJobDetails(spId, jobId);
    },
    execute: async (context: StepContext) => executeM3AuthorizeProvisioningConnection(context),
  },

  "M-4": {
    check: async (context: StepContext) => {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
      if (!spId || !jobId) return { completed: false, message: "Missing configuration." };
      return checkMicrosoftAttributeMappingsApplied(spId, jobId);
    },
    execute: async (context: StepContext) => executeM4ConfigureProvisioningAttributeMappings(context),
  },

  "M-5": {
    check: async (context: StepContext) => {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
      if (!spId || !jobId) return { completed: false, message: "Missing configuration." };
      const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
      if (result.completed && result.outputs?.provisioningJobState === "Active") {
        return { completed: true, message: "Provisioning job is active." };
      }
      return { completed: false, message: "Provisioning job is not active." };
    },
    execute: async (context: StepContext) => executeM5StartProvisioningJob(context),
  },

  "M-6": {
    check: async (context: StepContext) => {
      const appId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_ID] as string;
      if (!appId) return { completed: false, message: "SAML SSO App ID not found." };
      const result = await checkMicrosoftServicePrincipal(appId);
      if (result.completed && result.outputs) {
        return {
          ...result,
          outputs: {
            [OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID]: result.outputs.spId,
            [OUTPUT_KEYS.SAML_SSO_APP_ID]: result.outputs.retrievedAppId,
            [OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID]: result.outputs.appObjectId,
          }
        };
      }
      return result;
    },
    execute: async (context: StepContext) => executeM6CreateSamlSsoApp(context),
  },

  "M-7": {
    check: async (context: StepContext) => {
      const appObjectId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID] as string;
      const spEntityId = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] as string;
      const acsUrl = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] as string;
      if (!appObjectId || !spEntityId || !acsUrl) {
        return { completed: false, message: "Missing required configuration." };
      }
      return checkMicrosoftSamlAppSettingsApplied(appObjectId, spEntityId, acsUrl);
    },
    execute: async (context: StepContext) => executeM7ConfigureAzureSamlAppSettings(context),
  },

  "M-8": {
    check: async (context: StepContext) => {
      return context.outputs[OUTPUT_KEYS.IDP_CERTIFICATE_BASE64] &&
        context.outputs[OUTPUT_KEYS.IDP_SSO_URL] &&
        context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID]
        ? { completed: true, message: "Azure AD IdP metadata retrieved." }
        : { completed: false, message: "Azure AD IdP metadata not retrieved." };
    },
    execute: async (context: StepContext) => executeM8RetrieveAzureIdpMetadata(context),
  },

  "M-9": {
    check: async (context: StepContext) => {
      const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
      if (!spId) return { completed: false, message: "SAML SSO SP ID not found." };
      return checkMicrosoftAppAssignments(spId);
    },
    execute: async (context: StepContext) => executeM9AssignUsersToAzureSsoApp(context),
  },

  "M-10": {
    check: async (_context: StepContext) => ({
      completed: false,
      message: "Manual testing required.",
    }),
    execute: async (_context: StepContext) => ({
      success: true,
      message: "Test SSO: \n1. Open a new Incognito/Private browser window. \n2. Navigate to a Google service...",
      resourceUrl: "https://myapps.microsoft.com",
    }),
  },
} as const;

export async function checkStep(stepId: string, context: StepContext): Promise<StepCheckResult> {
  const step = STEP_REGISTRY[stepId as keyof typeof STEP_REGISTRY];
  if (!step?.check) {
    return { completed: false, message: "No check available for this step." };
  }
  return step.check(context);
}

export async function executeStep(stepId: string, context: StepContext): Promise<StepExecutionResult> {
  const step = STEP_REGISTRY[stepId as keyof typeof STEP_REGISTRY];
  if (!step?.execute) {
    return { success: false, error: { message: "No execution available for this step." } };
  }
  return step.execute(context);
}
