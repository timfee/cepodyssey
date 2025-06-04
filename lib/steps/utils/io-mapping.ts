import { OUTPUT_KEYS } from "@/lib/types";
import type { StepInput, StepOutput } from "@/lib/types";

export function getStepInputs(stepId: string): StepInput[] {
  const inputMappings: Record<string, StepInput[]> = {
    "G-1": [],
    "G-2": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.AUTOMATION_OU_PATH,
          description: "Path to the Automation organizational unit",
        },
        stepTitle: "Create 'Automation' Organizational Unit",
      },
    ],
    "G-3": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
          description: "Email of the provisioning user",
        },
        stepTitle: "Create Provisioning User",
      },
    ],
    "G-6": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
          description: "Full name of the Google SAML profile",
        },
        stepTitle: "Initiate Google SAML Profile",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.IDP_ENTITY_ID,
          description: "Azure AD Entity ID",
        },
        stepTitle: "Retrieve Azure AD IdP Metadata",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.IDP_SSO_URL,
          description: "Azure AD SSO URL",
        },
        stepTitle: "Retrieve Azure AD IdP Metadata",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
          description: "Azure AD signing certificate",
        },
        stepTitle: "Retrieve Azure AD IdP Metadata",
      },
    ],
    "G-7": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
          description: "Full name of the Google SAML profile",
        },
        stepTitle: "Initiate Google SAML Profile",
      },
    ],
    "G-8": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
          description: "Full name of the Google SAML profile",
        },
        stepTitle: "Initiate Google SAML Profile",
      },
    ],
    "M-5": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
          description: "Provisioning service principal object ID",
        },
        stepTitle: "Create Azure AD Enterprise App for Provisioning",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_JOB_ID,
          description: "Provisioning job identifier",
        },
        stepTitle: "Authorize Azure AD Provisioning to Google Workspace",
      },
    ],
    "M-2": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
          description: "Provisioning service principal object ID",
        },
        stepTitle: "Create Azure AD Enterprise App for Provisioning",
      },
    ],
    "M-3": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
          description: "Email of the provisioning user",
        },
        stepTitle: "Create Provisioning User",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
          description: "Provisioning service principal object ID",
        },
        stepTitle: "Enable Provisioning App Service Principal",
      },
    ],
    "M-4": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.PROVISIONING_JOB_ID,
          description: "Provisioning job identifier",
        },
        stepTitle: "Authorize Azure AD Provisioning to Google Workspace",
      },
    ],
    "M-7": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
          description: "Google SAML SP Entity ID",
        },
        stepTitle: "Initiate Google SAML Profile",
      },
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.GOOGLE_SAML_ACS_URL,
          description: "Google SAML ACS URL",
        },
        stepTitle: "Initiate Google SAML Profile",
      },
    ],
    "M-8": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_ID,
          description: "SAML SSO App ID",
        },
        stepTitle: "Create Azure AD Enterprise App for SAML SSO",
      },
    ],
    "M-9": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
          description: "SAML SSO service principal ID",
        },
        stepTitle: "Create Azure AD Enterprise App for SAML SSO",
      },
    ],
    "M-10": [
      {
        type: "keyValue",
        data: {
          key: OUTPUT_KEYS.SAML_SSO_APP_ID,
          description: "SAML SSO App ID",
        },
        stepTitle: "Create Azure AD Enterprise App for SAML SSO",
      },
    ],
  };
  return inputMappings[stepId] || [];
}

export function getStepOutputs(stepId: string): StepOutput[] {
  const outputMappings: Record<string, StepOutput[]> = {
    "G-1": [
      {
        key: OUTPUT_KEYS.AUTOMATION_OU_ID,
        description: "Unique identifier for the organizational unit",
      },
      {
        key: OUTPUT_KEYS.AUTOMATION_OU_PATH,
        description: "Full path to the organizational unit",
      },
    ],
    "G-2": [
      {
        key: OUTPUT_KEYS.SERVICE_ACCOUNT_EMAIL,
        description: "Email address of the provisioning user",
      },
      {
        key: OUTPUT_KEYS.SERVICE_ACCOUNT_ID,
        description: "Unique identifier for the provisioning user",
      },
    ],
    "G-3": [
      {
        key: OUTPUT_KEYS.SUPER_ADMIN_ROLE_ID,
        description: "Role assignment ID for Super Admin",
      },
    ],
    "G-5": [
      {
        key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_NAME,
        description: "SAML profile name",
      },
      {
        key: OUTPUT_KEYS.GOOGLE_SAML_PROFILE_FULL_NAME,
        description: "Full resource name of the SAML profile",
      },
      {
        key: OUTPUT_KEYS.GOOGLE_SAML_SP_ENTITY_ID,
        description: "Google SP Entity ID",
      },
      { key: OUTPUT_KEYS.GOOGLE_SAML_ACS_URL, description: "Google ACS URL" },
    ],
    "M-1": [
      {
        key: OUTPUT_KEYS.PROVISIONING_APP_ID,
        description: "Provisioning app (client) ID",
      },
      {
        key: OUTPUT_KEYS.PROVISIONING_APP_OBJECT_ID,
        description: "Application object ID",
      },
      {
        key: OUTPUT_KEYS.PROVISIONING_SP_OBJECT_ID,
        description: "Service principal object ID",
      },
    ],
    "M-2": [
      {
        key: OUTPUT_KEYS.FLAG_M2_PROV_APP_PROPS_CONFIGURED,
        description: "Flag indicating provisioning app enabled",
      },
    ],
    "M-3": [
      {
        key: OUTPUT_KEYS.PROVISIONING_JOB_ID,
        description: "Provisioning synchronization job ID",
      },
      {
        key: OUTPUT_KEYS.FLAG_M3_PROV_CREDS_CONFIGURED,
        description: "Flag indicating provisioning credentials authorized",
      },
    ],
    "M-4": [
      {
        key: OUTPUT_KEYS.FLAG_M4_PROV_MAPPINGS_CONFIGURED,
        description: "Flag indicating attribute mappings configured",
      },
    ],
    "M-6": [
      {
        key: OUTPUT_KEYS.SAML_SSO_APP_ID,
        description: "SAML SSO app (client) ID",
      },
      {
        key: OUTPUT_KEYS.SAML_SSO_APP_OBJECT_ID,
        description: "SAML SSO application object ID",
      },
      {
        key: OUTPUT_KEYS.SAML_SSO_SP_OBJECT_ID,
        description: "SAML SSO service principal object ID",
      },
    ],
    "M-7": [
      {
        key: OUTPUT_KEYS.FLAG_M7_SAML_APP_SETTINGS_CONFIGURED,
        description: "Flag indicating SAML app settings applied",
      },
    ],
    "M-8": [
      {
        key: OUTPUT_KEYS.IDP_CERTIFICATE_BASE64,
        description: "Base64-encoded IdP certificate",
      },
      { key: OUTPUT_KEYS.IDP_SSO_URL, description: "Azure AD SSO URL" },
      { key: OUTPUT_KEYS.IDP_ENTITY_ID, description: "Azure AD entity ID" },
    ],
    "M-10": [
      {
        key: OUTPUT_KEYS.FLAG_M10_SSO_TESTED,
        description: "Flag indicating SSO tested successfully",
      },
    ],
  };
  return outputMappings[stepId] || [];
}
