import { config } from "@/lib/config";
import NextAuth from "next-auth";
import jwt from "./callbacks/jwt";
import session from "./callbacks/session";
import signInCallback from "./callbacks/signin";
import googleProvider from "./providers/google";
import microsoftProvider from "./providers/microsoft";
export { cleanupInvalidSession } from "./utils/session-store";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: config.AUTH_SECRET,
  providers: [googleProvider, microsoftProvider],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: { signIn: signInCallback, jwt, session },
});
