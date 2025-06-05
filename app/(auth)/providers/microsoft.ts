import MicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";

const microsoftProvider = MicrosoftEntraIDProvider({
  clientId: process.env.MICROSOFT_CLIENT_ID!,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
  issuer: `https://login.microsoftonline.com/${
    process.env.MICROSOFT_TENANT_ID ?? "common"
  }/v2.0`,
  authorization: {
    params: {
      scope: `${process.env.MICROSOFT_GRAPH_SCOPES!} offline_access`,
      prompt: "consent",
      response_mode: "query",
    },
  },
  allowDangerousEmailAccountLinking: true,
});

export default microsoftProvider;
