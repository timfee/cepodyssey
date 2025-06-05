import { config } from "@/lib/config";
import GoogleProvider from "next-auth/providers/google";

const googleProvider = GoogleProvider({
  clientId: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  authorization: {
    params: {
      scope: config.GOOGLE_ADMIN_SCOPES,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
    },
  },
  allowDangerousEmailAccountLinking: true,
});

export default googleProvider;
