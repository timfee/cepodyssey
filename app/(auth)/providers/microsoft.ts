import MicrosoftEntraIDProvider from "next-auth/providers/microsoft-entra-id";
import { config } from "@/lib/config";

const microsoftProvider = MicrosoftEntraIDProvider({
  clientId: config.MICROSOFT_CLIENT_ID,
  clientSecret: config.MICROSOFT_CLIENT_SECRET,
  issuer: `https://login.microsoftonline.com/${
    config.MICROSOFT_TENANT_ID ?? "common"
  }/v2.0`,
  authorization: {
    params: {
      scope: `${config.MICROSOFT_GRAPH_SCOPES} offline_access`,
      prompt: "consent",
      response_mode: "query",
    },
  },
  allowDangerousEmailAccountLinking: true,
});

export default microsoftProvider;
