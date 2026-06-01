# Serwist Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `@ducanh2912/next-pwa` with `@serwist/next` for long-term PWA maintainability — no behaviour change, no DB/Supabase changes.

**Architecture:** Serwist compiles an explicit `app/sw.ts` service worker file during `next build`, placing the output at `public/sw.js`. The webpack plugin injects the precache manifest automatically. `SerwistProvider` in `ClientShell` handles SW registration in the browser.

**Tech Stack:** `@serwist/next@9.5.11`, `serwist@9.5.11`, Next.js 16.2.6, webpack mode.

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Modify | `package.json` | Swap `@ducanh2912/next-pwa` → `@serwist/next` + `serwist` |
| Modify | `next.config.ts` | Swap `withPWA` from old pkg → `withSerwistInit` from new pkg |
| **Create** | `app/sw.ts` | New explicit service worker (replaces auto-generated one) |
| Modify | `app/client-shell.tsx` | Wrap with `SerwistProvider` for SW registration |
| Delete | `public/sw.js` | Old auto-generated SW (Serwist regenerates this on build) |
| Delete | `public/swe-worker-*.js` | Old auto-generated Serwist cache worker |
| Delete | `public/workbox-*.js` | Old Workbox runtime chunk |

---

## Task 1: Swap packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall old, install new**

```bash
npm uninstall @ducanh2912/next-pwa
npm install @serwist/next serwist
```

Expected: no errors. `package.json` now shows `"@serwist/next": "^9.5.11"` and `"serwist": "^9.5.11"` in dependencies.

- [ ] **Step 2: Verify installed versions**

```bash
npm list @serwist/next serwist
```

Expected output (versions may patch-vary):
```
├── @serwist/next@9.5.11
└── serwist@9.5.11
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap @ducanh2912/next-pwa for @serwist/next"
```

---

## Task 2: Create the service worker file

**Files:**
- Create: `app/sw.ts`

- [ ] **Step 1: Create `app/sw.ts`**

```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

- [ ] **Step 2: Commit**

```bash
git add app/sw.ts
git commit -m "feat(pwa): add explicit Serwist service worker"
```

---

## Task 3: Update next.config.ts

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Replace the file content**

Full replacement — keep all existing security headers and image config, only swap the PWA wrapper:

```typescript
import type { NextConfig } from 'next'
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' blob: data: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',    value: 'off' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy',   value: CSP },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV === 'development') return []
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withSerwist(nextConfig)
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "feat(pwa): wire Serwist into next.config.ts"
```

---

## Task 4: Add SerwistProvider to ClientShell

**Files:**
- Modify: `app/client-shell.tsx`

- [ ] **Step 1: Replace file content**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/client-shell.tsx
git commit -m "feat(pwa): register service worker via SerwistProvider"
```

---

## Task 5: Delete old generated public files

**Files:**
- Delete: `public/sw.js`
- Delete: `public/swe-worker-*.js`
- Delete: `public/workbox-*.js`

These were auto-generated by `@ducanh2912/next-pwa`. Serwist regenerates `public/sw.js` during `npm run build`. The old workbox/swe-worker chunks are no longer needed.

- [ ] **Step 1: Delete the old files**

```bash
rm public/sw.js
rm public/swe-worker-*.js
rm public/workbox-*.js
```

- [ ] **Step 2: Verify they're gone**

```bash
ls public/
```

Expected: only `icons/`, `file.svg`, `globe.svg`, `qris.jpeg`, `tcs-logo.png`, `tcs-pop-art.png`, `window.svg` remain. No `sw.js`, no `workbox-*`, no `swe-worker-*`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(pwa): remove old @ducanh2912/next-pwa generated files"
```

---

## Task 6: Verify build

**Files:** none changed — read-only verification step.

- [ ] **Step 1: Run a production build**

```bash
npm run build
```

Expected: build succeeds with no errors. You should see Serwist output lines mentioning the service worker being compiled (similar to `[serwist] Compiled service worker successfully`). `public/sw.js` should be regenerated.

- [ ] **Step 2: Confirm public/sw.js was generated**

```bash
ls public/sw.js
```

Expected: file exists, was just created by the build.

- [ ] **Step 3: Push everything**

```bash
git push origin main
```

---

## What does NOT change

- Supabase, DB schema, RLS — untouched
- `app/manifest.ts` — untouched (PWA installability already handled there)
- All page/component files — untouched
- `--webpack` flag in dev/build scripts — still required (Serwist webpack version needs it)
- Security headers in `next.config.ts` — preserved exactly
