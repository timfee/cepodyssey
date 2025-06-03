import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import localFont from "next/font/local";

const inter = localFont({
  src: [
    {
      path: "../public/InterVariable.woff2",
      style: "normal",
    },
    {
      path: "../public/InterVariable-Italic.woff2",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: "Directory Setup Assistant",
  description: "Automate Google Workspace and Microsoft Entra ID Integration",
};
/**
 * Root layout wrapping the entire application with providers and global styles.
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Alert className="sticky top-0 z-50 !border-none bg-amber-100 text-amber-800">
          <AlertDescription className="flex items-center">
            <AlertTriangleIcon />
            <strong className="ml-2 mr-4">Proof of Concept</strong>
            <span>
              Do not use this for any production environment. Google OAuth
              requires allowlisting; contact{" "}
              <a className="underline" href="mailto:timfee@google.com">
                timfee@
              </a>{" "}
              for access.
            </span>
          </AlertDescription>
        </Alert>
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
