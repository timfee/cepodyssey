/**
 * Collection of Microsoft-related automation step definitions.
 */
import type { StepDefinition } from "../../types";
import { m1CreateProvisioningApp } from "./create-provisioning-app";
import { m2EnableProvisioningSp } from "./enable-provisioning-sp";
import { m3AuthorizeProvisioning } from "./authorize-provisioning";
import { m4ConfigureAttributeMappings } from "./configure-attribute-mappings";
import { m5StartProvisioning } from "./start-provisioning";
import { m6CreateSamlApp } from "./create-saml-app";
import { m7ConfigureSamlApp } from "./configure-saml-app";
import { m8RetrieveIdpMetadata } from "./retrieve-idp-metadata";
import { m9AssignUsersSso } from "./assign-users-sso";
import { m10TestSso } from "./test-sso";

export const microsoftSteps: StepDefinition[] = [
  m1CreateProvisioningApp,
  m2EnableProvisioningSp,
  m3AuthorizeProvisioning,
  m4ConfigureAttributeMappings,
  m5StartProvisioning,
  m6CreateSamlApp,
  m7ConfigureSamlApp,
  m8RetrieveIdpMetadata,
  m9AssignUsersSso,
  m10TestSso,
];
