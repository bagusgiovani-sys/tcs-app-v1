# Security Headers, Error Boundaries & Lazy Loading — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the TCS Coffee PWA with security headers, graceful error boundaries for every route group, and dynamic imports for components that are conditionally rendered or admin/POS-only.

**Architecture:** Security headers live in `next.config.ts` via the `headers()` async function and apply to every route. Error boundaries use Next.js App Router `error.tsx` convention — one file per route group catches crashes within that segment without crashing sibling routes. Lazy loading uses `next/dynamic` with `ssr: false` on client components that are either modal/conditional or only ever rendered in non-customer routes.

**Tech Stack:** Next.js 16 App Router, `next/dynamic`, Tailwind CSS v4 with `@theme` tokens

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `next.config.ts` | Modify | Add `headers()` with CSP + 6 security headers |
| `app/global-error.tsx` | Create | Root crash boundary — must include `<html>` + `<body>` |
| `app/(customer)/error.tsx` | Create | Customer route crash boundary |
| `app/admin/error.tsx` | Create | Admin route crash boundary |
| `app/auth/error.tsx` | Create | Auth route crash boundary |
| `app/pos/error.tsx` | Create | POS route crash boundary |
| `app/pos/_components/POSClient.tsx` | Modify | Lazy load `POSQRISModal` |
| `app/(customer)/checkout/page.tsx` | Modify | Lazy load `QRISDisplay` |
| `app/admin/orders/page.tsx` | Modify | Lazy load `AdminOrderQueue` |

---

## Task 1: Security Headers

**Files:**
- Modify: `next.config.ts`

Headers to add (applied to every route via `source: '/(.*)'`):

| Header | Value | Why |
|---|---|---|
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetch leaking visited URLs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS, 2-year pin |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer header to origin only on cross-origin |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Denies sensor access the app never uses |
| `Content-Security-Policy` | See below | Restricts where resources can load from |

**CSP breakdown:**
- `script-src 'self' 'unsafe-inline'` — needed for the FOUC inline script in `layout.tsx`
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Framer Motion inline styles + Google Fonts stylesheet
- `font-src 'self' https://fonts.gstatic.com` — Google Fonts files
- `img-src 'self' blob: data: https:` — Supabase storage images + QRIS image (unknown host)
- `connect-src 'self' https://*.supabase.co wss://*.supabase.co` — Supabase REST + Realtime WebSocket
- `frame-ancestors 'none'` — stronger than X-Frame-Options, disallows embedding in iframes
- `base-uri 'self'` — prevents base tag injection
- `form-action 'self'` — prevents form hijacking to external URLs

- [ ] **Step 1: Replace `next.config.ts` with headers-enabled version**

```typescript
import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

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
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

- [ ] **Step 2: Verify headers appear in dev server**

```bash
npx next dev --webpack
# In a second terminal:
curl -I http://localhost:3000 | grep -E "x-frame|content-security|x-content"
```

Expected output includes:
```
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
content-security-policy: default-src 'self'; ...
```

---

## Task 2: Root Global Error Boundary

**Files:**
- Create: `app/global-error.tsx`

`global-error.tsx` replaces the entire root layout when an unhandled error escapes all nested boundaries. It **must** render its own `<html>` and `<body>` — it cannot use fonts from `layout.tsx` (Server Component). Use inline `style` for the warm background instead of Tailwind tokens.

- [ ] **Step 1: Create `app/global-error.tsx`**

```tsx
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="id">
      <body style={{ margin: 0, background: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: '360px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕</p>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1A0F0A', marginBottom: '0.5rem' }}>
            Terjadi kesalahan
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#7A4A2A', marginBottom: '1.5rem' }}>
            Aplikasi mengalami masalah tak terduga.
          </p>
          <button
            onClick={reset}
            style={{ background: '#CE9760', color: '#39260B', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors relating to `global-error.tsx`.

---

## Task 3: Customer Route Error Boundary

**Files:**
- Create: `app/(customer)/error.tsx`

This catches any unhandled error thrown in `/`, `/menu`, `/product/[id]`, `/cart`, `/checkout`, `/order/[id]`, `/loyalty`, `/profile`. It has access to the root layout (fonts, body styles) so can use Tailwind token classes.

- [ ] **Step 1: Create `app/(customer)/error.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[CustomerError]', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="text-4xl">☕</p>
      <h1 className="font-sans font-bold text-xl text-brand-text">Ups, ada yang salah</h1>
      <p className="font-sans text-sm text-brand-subtext">
        Halaman ini mengalami masalah. Coba lagi atau kembali ke menu.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-subtext font-sans font-semibold text-sm"
        >
          Ke Menu
        </Link>
      </div>
    </div>
  )
}
```

---

## Task 4: Admin Route Error Boundary

**Files:**
- Create: `app/admin/error.tsx`

Catches crashes in `/admin`, `/admin/orders`, `/admin/menu`, `/admin/menu/[id]`. Admin layout (Sidebar) stays intact — only the `<main>` content area is replaced by this boundary.

- [ ] **Step 1: Create `app/admin/error.tsx`**

```tsx
'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AdminError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-6">
      <p className="text-3xl">⚠️</p>
      <h2 className="font-sans font-bold text-lg text-brand-text">Halaman admin error</h2>
      <p className="font-sans text-sm text-brand-subtext">
        Terjadi kesalahan saat memuat halaman ini.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
      >
        Coba lagi
      </button>
    </div>
  )
}
```

---

## Task 5: Auth + POS Error Boundaries

**Files:**
- Create: `app/auth/error.tsx`
- Create: `app/pos/error.tsx`

Both are minimal — auth errors usually mean something systemic; POS errors need a clean retry since the cashier can't navigate away easily.

- [ ] **Step 1: Create `app/auth/error.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[AuthError]', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="text-4xl">🔐</p>
      <h1 className="font-sans font-bold text-xl text-brand-text">Gagal memuat</h1>
      <p className="font-sans text-sm text-brand-subtext">
        Terjadi kesalahan pada halaman autentikasi.
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl border border-brand-border text-brand-subtext font-sans font-semibold text-sm"
        >
          Beranda
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `app/pos/error.tsx`**

```tsx
'use client'

import { useEffect } from 'react'

export default function POSError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[POSError]', error)
  }, [error])

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center px-6 text-center gap-4">
      <p className="text-4xl">🖨️</p>
      <h1 className="font-sans font-bold text-xl text-brand-text">POS Error</h1>
      <p className="font-sans text-sm text-brand-subtext">
        Kasir mengalami masalah. Tap tombol di bawah untuk memuat ulang.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-on-accent font-sans font-semibold text-sm"
      >
        Muat Ulang
      </button>
    </div>
  )
}
```

---

## Task 6: Lazy Load POSQRISModal

**Files:**
- Modify: `app/pos/_components/POSClient.tsx`

`POSQRISModal` is only mounted when `orderId` is set (after the cashier taps checkout). It imports the QRIS image display + Framer Motion sheet — zero reason to include it in the initial JS bundle for the POS page.

- [ ] **Step 1: Replace static import with `dynamic()` in `POSClient.tsx`**

Change the import at the top of the file:

```typescript
// REMOVE this line:
import POSQRISModal from '@/components/pos/POSQRISModal'

// ADD this line:
import dynamic from 'next/dynamic'
const POSQRISModal = dynamic(() => import('@/components/pos/POSQRISModal'), { ssr: false })
```

No other changes — the JSX usage stays identical.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

---

## Task 7: Lazy Load QRISDisplay in Checkout

**Files:**
- Modify: `app/(customer)/checkout/page.tsx`

`QRISDisplay` is only rendered when `orderId !== null` — after the order is placed. This component includes the QRIS image and a Framer-animated confirmation button. Customers who pay cash never see it at all.

- [ ] **Step 1: Replace static import with `dynamic()` in `checkout/page.tsx`**

Change the import at the top of the file:

```typescript
// REMOVE this line:
import QRISDisplay from '@/components/customer/QRISDisplay'

// ADD this line:
import dynamic from 'next/dynamic'
const QRISDisplay = dynamic(() => import('@/components/customer/QRISDisplay'), { ssr: false })
```

No other changes needed — the JSX block that renders `<QRISDisplay ... />` is unchanged.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

---

## Task 8: Lazy Load AdminOrderQueue

**Files:**
- Modify: `app/admin/orders/page.tsx`

`AdminOrderQueue` is a `'use client'` component that opens a Supabase Realtime channel. It's server-rendered as an empty shell and hydrates on the client. Making it dynamic defers the Supabase channel setup and the entire `OrderQueue` component tree until after the admin page shell has painted.

- [ ] **Step 1: Replace static import with `dynamic()` in `admin/orders/page.tsx`**

```typescript
// REMOVE this line:
import AdminOrderQueue from './_components/AdminOrderQueue'

// ADD these lines:
import dynamic from 'next/dynamic'
const AdminOrderQueue = dynamic(() => import('./_components/AdminOrderQueue'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-24 rounded-2xl bg-brand-muted animate-pulse" />
      ))}
    </div>
  ),
})
```

This is the one case where a `loading` skeleton makes sense — the admin sees a pulsing placeholder for the ~300ms it takes to hydrate instead of a blank area.

Note: `page.tsx` is an `async` Server Component that already fetches `initialOrders`. The `dynamic()` call for a client component is valid here — Next.js will send the Server Component HTML immediately and hydrate `AdminOrderQueue` on the client.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

---

## Task 9: Build Verification + Commit

**Files:** none — verify then commit all changes from Tasks 1–8.

- [ ] **Step 1: Run production build**

```bash
cd "C:\Exodus\Projects\TCS App\tcs-saas-app"
npx next build --webpack 2>&1
```

Expected output ends with:
```
✓ Generating static pages using 7 workers (18/18)
```
And the route table shows all 18 routes. No `⨯` errors.

- [ ] **Step 2: Stage and commit**

```bash
git add \
  next.config.ts \
  app/global-error.tsx \
  "app/(customer)/error.tsx" \
  app/admin/error.tsx \
  app/auth/error.tsx \
  app/pos/error.tsx \
  "app/pos/_components/POSClient.tsx" \
  "app/(customer)/checkout/page.tsx" \
  app/admin/orders/page.tsx
git commit -m "feat: security headers, error boundaries, lazy loading

- next.config.ts: CSP + 6 security headers on all routes
- app/**/error.tsx: per-route-group error boundaries (customer, admin, auth, pos)
- app/global-error.tsx: root crash boundary
- dynamic() lazy load: POSQRISModal, QRISDisplay, AdminOrderQueue

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Security headers — Task 1
- ✅ Error boundary (root) — Task 2
- ✅ Error boundaries (per route group) — Tasks 3–5
- ✅ Lazy loading (conditional components) — Tasks 6–8
- ✅ Build verification — Task 9

**Placeholder scan:** None found. All steps have complete code.

**Type consistency:**
- `error: Error & { digest?: string }` and `reset: () => void` used consistently across all 5 error files
- `dynamic()` return type infers correctly from the imported component — no explicit typing needed

**Scope:** Fits a single session. All 9 tasks are independent of each other after Task 1 (headers) sets the foundation.
