/**
 * Collection of Google-related automation step definitions.
 */
import type { StepDefinition } from "../../types";
import { g1CreateAutomationOu } from "./create-automation-ou";
import { g2CreateProvisioningUser } from "./create-provisioning-user";
import { g3GrantSuperAdmin } from "./grant-super-admin";
import { g4VerifyDomain } from "./verify-domain";
import { g5InitiateSamlProfile } from "./initiate-saml-profile";
import { g6UpdateSamlProfile } from "./update-saml-profile";
import { g7AssignSamlProfile } from "./assign-saml-profile";
import { g8ExcludeAutomationOu } from "./exclude-automation-ou";

export const googleSteps: StepDefinition[] = [
  g1CreateAutomationOu,
  g2CreateProvisioningUser,
  g3GrantSuperAdmin,
  g4VerifyDomain,
  g5InitiateSamlProfile,
  g6UpdateSamlProfile,
  g7AssignSamlProfile,
  g8ExcludeAutomationOu,
];
