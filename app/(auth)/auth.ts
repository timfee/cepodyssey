import NextAuth from "next-auth";
import googleProvider from "./providers/google";
import microsoftProvider from "./providers/microsoft";
import signInCallback from "./callbacks/signin";
import jwt from "./callbacks/jwt";
import session from "./callbacks/session";
export { cleanupInvalidSession } from "./utils/session-store";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [googleProvider, microsoftProvider],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: { signIn: signInCallback, jwt, session },
});
