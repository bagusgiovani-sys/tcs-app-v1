'use client'

import * as React from 'react'
import { SerwistProvider } from '@serwist/next/react'
import SplashScreen from '@/components/splash/SplashScreen'

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js">
      <SplashScreen
        logoSrc="/tcs-logo.png"
        introMs={2200}
        collapseMs={1000}
        zoomMs={900}
        oncePerSession
      >
        {children}
      </SplashScreen>
    </SerwistProvider>
  )
}
