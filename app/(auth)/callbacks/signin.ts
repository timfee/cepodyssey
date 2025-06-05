import type { Account, Profile, User } from "next-auth";
import { checkGoogleAdmin, checkMicrosoftAdmin } from "../utils/admin-checks";

export default async function signIn({
  user,
  account,
  profile,
}: {
  user?: User | null;
  account?: Account | null;
  profile?: Profile | null;
}): Promise<string | boolean> {
  if (!account || !profile || !user?.email) {
    return "/login?error=SignInInformationMissing";
  }
  let isAdmin = false;
  if (account.provider === "google") {
    isAdmin = await checkGoogleAdmin(account.access_token!, user.email);
    if (!isAdmin) return "/login?error=GoogleAdminRequired";
  } else if (account.provider === "microsoft-entra-id") {
    isAdmin = await checkMicrosoftAdmin(account.access_token!);
    if (!isAdmin) return "/login?error=MicrosoftAdminRequired";
  }
  return isAdmin;
}
