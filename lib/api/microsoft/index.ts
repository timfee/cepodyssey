import { applications } from "./resources/applications";
import { servicePrincipals } from "./resources/service-principals";
import { provisioning } from "./resources/provisioning";
import { saml } from "./resources/saml";
import { templates } from "./resources/templates";

/** Collection of resource-specific Microsoft Graph helpers. */
export const microsoftApi = {
  applications,
  servicePrincipals,
  provisioning,
  saml,
  templates,
};

export * from "./types";
