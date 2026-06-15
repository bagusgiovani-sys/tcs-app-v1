'use client'

import * as React from 'react'
import { SerwistProvider } from '@serwist/next/react'
import SplashScreen from '@/components/splash/SplashScreen'

const isDev = process.env.NODE_ENV !== 'production'

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const content = (
    <SplashScreen
      logoSrc="/tcs-logo.png"
      introMs={2200}
      collapseMs={1000}
      zoomMs={900}
      oncePerSession
    >
      {children}
    </SplashScreen>
  )

  if (isDev) return content

  return (
    <SerwistProvider swUrl="/sw.js">
      {content}
    </SerwistProvider>
  )
}
