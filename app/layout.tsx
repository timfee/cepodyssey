import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

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
        <Providers>
          {children}
          <Toaster richColors />
        </Providers>
      </body>
    </html>
  );
}
