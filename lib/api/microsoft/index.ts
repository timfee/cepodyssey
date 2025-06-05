import { applications } from "./resources/applications";
import { servicePrincipals } from "./resources/service-principals";
import { provisioning } from "./resources/provisioning";
import { saml } from "./resources/saml";

export const microsoftApi = {
  applications,
  servicePrincipals,
  provisioning,
  saml,
};

export * from "./types";
