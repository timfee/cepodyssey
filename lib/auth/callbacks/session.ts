import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { validateTokenPresence } from "../utils/admin-checks";

interface MutableUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default async function sessionCallback({
  session,
  token,
}: {
  session: Session;
  token: JWT;
}): Promise<Session> {
  const validation = await validateTokenPresence(token);
  if (!validation.valid) {
    session.error = "MissingTokens" as unknown as "RefreshTokenError";
    session.hasGoogleAuth = false;
    session.hasMicrosoftAuth = false;
    return session;
  }

  const mutable = session as Session & { user: MutableUser };
  mutable.user = mutable.user ?? {};
  mutable.user.id = token.sub ?? mutable.user.id;
  mutable.user.name = token.name ?? mutable.user.name;
  mutable.user.email = token.email ?? mutable.user.email;
  mutable.user.image = token.picture ?? mutable.user.image;
  mutable.hasGoogleAuth = !!token.googleAccessToken;
  mutable.hasMicrosoftAuth = !!token.microsoftAccessToken;
  mutable.googleToken = token.googleAccessToken;
  mutable.microsoftToken = token.microsoftAccessToken;
  mutable.microsoftTenantId = token.microsoftTenantId;
  mutable.authFlowDomain = token.authFlowDomain;
  if (token.error) mutable.error = token.error;
  return mutable;
}
