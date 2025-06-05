import GoogleProvider from "next-auth/providers/google";

const googleProvider = GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: process.env.GOOGLE_ADMIN_SCOPES!,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: true,
    },
  },
  allowDangerousEmailAccountLinking: true,
});

export default googleProvider;
