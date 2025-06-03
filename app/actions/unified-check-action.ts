"use server";

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
import type { StepCheckResult, StepContext } from "@/lib/types";
import { OUTPUT_KEYS } from "@/lib/types";

export async function executeStepCheck(
  stepId: string,
  context: StepContext,
): Promise<StepCheckResult> {
  switch (stepId) {
    case "G-1":
      return checkOrgUnitExists("/Automation");

    case "G-2": {
      const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
      if (!email) return { completed: false, message: "Service account not yet created." };
      return checkServiceAccountExists(email);
    }

    case "G-3": {
      const email = context.outputs[OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL] as string;
      if (!email) return { completed: false, message: "Service account email not found." };
      return checkServiceAccountIsAdmin(email);
    }

    case "G-4":
      if (!context.domain) return { completed: false, message: "Domain not configured." };
      return checkDomainVerified(context.domain);

    case "G-5":
      return checkGoogleSamlProfileDetails("Azure AD SSO", true, undefined);

    case "G-6": {
      const profileName = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME] as string;
      const idpEntityId = context.outputs[OUTPUT_KEYS.IDP_ENTITY_ID] as string;
      if (!profileName || !idpEntityId) {
        return { completed: false, message: "Missing required configuration." };
      }
      return checkGoogleSamlProfileDetails(profileName, false, idpEntityId);
    }

    case "M-1": {
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
          },
        };
      }
      return result;
    }

    case "M-2": {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      if (!spId) return { completed: false, message: "Service Principal ID not found." };
      return checkMicrosoftServicePrincipalEnabled(spId);
    }

    case "M-3": {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
      if (!spId) return { completed: false, message: "Service Principal ID not found." };
      return checkMicrosoftProvisioningJobDetails(spId, jobId);
    }

    case "M-4": {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
      if (!spId || !jobId) return { completed: false, message: "Missing configuration." };
      return checkMicrosoftAttributeMappingsApplied(spId, jobId);
    }

    case "M-5": {
      const spId = context.outputs[OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID] as string;
      const jobId = context.outputs[OUTPUT_KEYS.PROVISIONING_JOB_ID] as string;
      if (!spId || !jobId) return { completed: false, message: "Missing configuration." };
      const result = await checkMicrosoftProvisioningJobDetails(spId, jobId);
      if (result.completed && result.outputs?.provisioningJobState === "Active") {
        return { completed: true, message: "Provisioning job is active." };
      }
      return { completed: false, message: "Provisioning job is not active." };
    }

    case "M-6": {
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
          },
        };
      }
      return result;
    }

    case "M-7": {
      const appObjectId = context.outputs[OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID] as string;
      const spEntityId = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID] as string;
      const acsUrl = context.outputs[OUTPUT_KEYS.GOOGLE_SAML_ACS_URL] as string;
      if (!appObjectId || !spEntityId || !acsUrl) {
        return { completed: false, message: "Missing required configuration." };
      }
      return checkMicrosoftSamlAppSettingsApplied(appObjectId, spEntityId, acsUrl);
    }

    case "M-9": {
      const spId = context.outputs[OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID] as string;
      if (!spId) return { completed: false, message: "SAML SSO SP ID not found." };
      return checkMicrosoftAppAssignments(spId);
    }

    default:
      return { completed: false, message: "Step does not have automated check." };
  }
}
