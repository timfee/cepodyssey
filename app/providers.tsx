"use client";

import { store } from "@/lib/redux/store";
import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";
import { Logger } from "@/lib/utils/logger";
/**
 * Wraps the app with NextAuth and Redux providers.
 */

Logger.initialize();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>{children}</ReduxProvider>
    </SessionProvider>
  );
}
