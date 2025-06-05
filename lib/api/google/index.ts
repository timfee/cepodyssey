import { users } from "./resources/users";
import { orgUnits } from "./resources/org-units";
import { domains } from "./resources/domains";
import { roles } from "./resources/roles";
import { saml } from "./resources/saml";

export const googleApi = {
  users,
  orgUnits,
  domains,
  roles,
  saml,
};

export * from "./types";
