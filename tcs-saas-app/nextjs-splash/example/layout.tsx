// EXAMPLE: app/layout.tsx (App Router)
// Mount the splash by wrapping {children} in <ClientShell />.

import type { Metadata, Viewport } from "next";
import ClientShell from "./client-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCS Coffee",
  description: "TCS Coffee PWA",
};

export const viewport: Viewport = {
  themeColor: "#FBE3C2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
