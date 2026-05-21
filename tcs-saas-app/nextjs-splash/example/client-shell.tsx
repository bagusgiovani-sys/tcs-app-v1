// EXAMPLE: app/client-shell.tsx
// A client wrapper you put around your app in the root layout so the
// SplashScreen handles intro→collapse→zoom→reveal. The splash mounts
// children immediately (so they hydrate under it) and reveals on phase=done.

"use client";

import * as React from "react";
import SplashScreen from "@/components/splash/SplashScreen";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <SplashScreen
      logoSrc="/tcs-logo.png"
      introMs={2200}
      collapseMs={1000}
      zoomMs={900}
      oncePerSession        // remove if you want it every page-load
      onFinish={() => {
        // optional: prefetch, fire analytics, etc.
      }}
    >
      {children}
    </SplashScreen>
  );
}
