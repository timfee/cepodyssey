"use client";

import { store } from "@/lib/redux/store";
import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";
import { GlobalErrorModal } from "@/components/global-error-modal";
/**
 * Wraps the app with NextAuth and Redux providers.
 */

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        {children}
        <GlobalErrorModal />
      </ReduxProvider>
    </SessionProvider>
  );
}
