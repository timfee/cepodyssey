import type { admin_directory_v1 } from "googleapis";

export type DirectoryUser = admin_directory_v1.Schema$User;
export type GoogleOrgUnit = admin_directory_v1.Schema$OrgUnit;
export type GoogleRole = admin_directory_v1.Schema$Role;
export type GoogleRoleAssignment = admin_directory_v1.Schema$RoleAssignment;
export type GoogleDomain = admin_directory_v1.Schema$Domains & {
  verified?: boolean;
};
export type GoogleDomains = admin_directory_v1.Schema$Domains;

export interface InboundSamlSsoProfile {
  /** Output only. Resource name, e.g. inboundSamlSsoProfiles/{profileId} */
  name?: string;
  /** Output only. Customer resource */
  customer?: string;
  /** Display name when creating the profile */
  displayName?: string;
  idpConfig?: {
    entityId?: string;
    singleSignOnServiceUri?: string;
    logoutRedirectUri?: string;
    changePasswordUri?: string;
  };
  /** Output only. SP configuration returned after creation */
  spConfig?: {
    entityId?: string;
    assertionConsumerServiceUri?: string;
  };
  ssoMode?: "SSO_OFF" | "SAML_SSO_ENABLED" | "SSO_INHERITED";
}

export interface SsoAssignment {
  orgUnitId: string;
  ssoMode: "SSO_OFF" | "SAML_SSO_ENABLED" | "SSO_INHERITED";
}

export interface IdpCredential {
  name?: string;
  updateTime?: string;
  rsaKeyInfo?: {
    keySize?: number;
  };
  dsaKeyInfo?: {
    keySize?: number;
  };
}
