import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

import { DebugPanel } from "@/components/debug-panel";
import { DebugPanelNub } from "@/components/debug-panel-nub";
import { ModalManager } from "@/components/modal-manager";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Directory Setup Assistant",
  description: "Automate Google Workspace and Microsoft Entra ID Integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <ModalManager />
          <DebugPanelNub />
          <DebugPanel />
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
