import { ClientProviders } from "./providers-client";
import { GlobalErrorModal } from "@/components/global-error-modal";

/**
 * Wraps the app with global providers.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientProviders>
      {children}
      <GlobalErrorModal />
    </ClientProviders>
  );
}
