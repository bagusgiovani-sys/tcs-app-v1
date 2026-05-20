# CLAUDE.md — TCS Coffee App
> Single source of truth. Read entirely before writing any code.

---

## 1. Project Overview

**TCS Coffee** — mobile-first PWA ordering app for a local UMKM in Cirebon, West Java, Indonesia.
Bypasses GoFood/GrabFood commission (15–30%) via direct ordering. Loyalty, vouchers, lightweight POS.
Architected for B2B (cafe→roastery) and Vibe Mood brand — both POST-MVP. Zero UI for either in MVP.

**NOT:** delivery app, marketplace, full POS, B2B platform, Vibe Mood app (yet).

**Real-world:** customers share via WhatsApp on Android. Payment is static QRIS. Indonesian context — IDR, Bahasa Indonesia.

---

## 2. Architecture Decisions — Do Not Reverse Without Strong Reason

| Decision | What | Why |
|---|---|---|
| Single codebase | Customer + Admin + POS in one Next.js project | Solo dev, same DB, role-based routing |
| Multi-tenant DB | `organizations` is root for shops AND roasteries | B2B addable without rebuilding |
| PWA not native | Next.js PWA, not React Native | Dev expertise, ASAP, WhatsApp-shareable |
| Supabase | Backend, auth, DB, realtime, storage | Solo dev can't maintain a separate backend |
| Static QRIS MVP | Display existing QRIS, manual confirmation | Zero registration needed, works immediately |
| TypeScript strict | Strict mode everywhere | Supabase generates types, catches errors early |
| Tailwind v4 CSS-first | No `tailwind.config.js` — tokens in `@theme {}` | Latest, CSS-first is cleaner for our token strategy |
| `@ducanh2912/next-pwa` | NOT `next-pwa` | Original unmaintained since 2022, broken on Next 13+ |
| Zustand for cart | Not Supabase, not Context | Cart is ephemeral client state |
| Mood engine local module | `lib/mood-engine/` inside TCS, not separate repo | No white-label clients yet — extract when client #2 exists |
| Dual theme | TCS mode (warm) + Vibe mode (colorful) via `.vibe` class | Same pattern as dark mode, Vibe brand has own identity |

---

## 3. Tech Stack

```
Next.js (latest)         App Router, TypeScript strict
Tailwind CSS v4 (latest) CSS-first, no tailwind.config.js
Framer Motion (latest)   Animations
Zustand (latest)         Cart state only
Supabase (latest)        DB, auth, storage, realtime
@ducanh2912/next-pwa     PWA — NEVER use next-pwa
Vercel                   Hosting, auto-deploy from main
```

**Version rule:** run `npm view [pkg] version` before installing anything.
**One exception:** `next-pwa` — NEVER install. Use `@ducanh2912/next-pwa`.

```bash
npm install @supabase/ssr @supabase/supabase-js framer-motion zustand @ducanh2912/next-pwa
```

Use `@supabase/ssr` NOT `@supabase/auth-helpers-nextjs` (deprecated).

---

## 4. Database Schema

@schema.md

---

## 5. Project Structure

```
tcs-coffee/
├── app/
│   ├── (auth)/login/ + register/
│   ├── (customer)/          ← home, menu, product/[id], cart, checkout, order/[id], loyalty
│   ├── admin/               ← dashboard, orders, menu/[id], vouchers, loyalty
│   ├── pos/                 ← cashier view
│   ├── layout.tsx           ← root layout + FOUC script
│   ├── globals.css          ← @import tailwindcss, @custom-variant dark, @theme tokens
│   └── manifest.ts          ← typed PWA manifest (MetadataRoute.Manifest)
├── public/icons/            ← icon-192.png + icon-512.png (required for PWA)
├── components/ui/           ← Button, Input, Badge, Card, Sheet, Skeleton, Toast
├── components/customer/     ← ProductCard, CartItem, OrderStatusBadge, LoyaltyCard, QRISDisplay, BottomNav
├── components/admin/        ← OrderCard, OrderQueue, ProductForm, Sidebar, StatCard
├── components/pos/          ← MenuGrid, OrderBuilder, POSQRISModal
├── lib/mood-engine/         ← POST-MVP: types.ts, taxonomy/coffee.ts, mapper.ts, recommender.ts
├── lib/supabase/            ← client.ts, server.ts, types.ts (generated)
├── lib/stores/cart.ts       ← Zustand cart store
├── lib/hooks/               ← useCart, useOrders (realtime), useAuth
├── lib/utils/               ← currency.ts, loyalty.ts, orders.ts, constants.ts
├── middleware.ts
├── next.config.ts
└── CLAUDE.md
```

**constants.ts:** `SHOP_ID`, `THEME_KEY = 'tcs-theme'`, `MODE_KEY = 'tcs-mode'`

---

## 6. Auth, Roles & Routes

```
customer → browse, order, loyalty
staff    → everything + /pos
admin    → everything + /admin/*
```

```
Public:      / /menu /product/*
Auth only:   /cart /checkout /order/* /loyalty
Admin only:  /admin/*
Staff+Admin: /pos
```

Middleware: refresh session → check role → redirect or allow. Pass `redirectTo` param on redirect to `/auth/login`. Never trust client-side role claims — always verify from DB in server components.

---

## 7. Design System

@design.md

---

## 8. MVP Scope

**IN:** customer ordering (browse→cart→QRIS→status→history), loyalty points, vouchers, light/dark toggle, admin dashboard (orders/menu/vouchers/loyalty settings), POS cashier view.

**OUT — do not build:**
- Delivery, multiple shops, B2B UI, Midtrans, push notifications, Play Store
- Inventory, analytics charts, customer profile editing, social login, reviews
- **Vibe Mood UI** — module exists in lib/ but zero screens in MVP
- **Mood engine API** — do not build until white-label client #1 exists

---

## 9. Key Business Logic

**Order flow:** pending → confirmed → preparing → ready → completed

**QRIS payment:** Order created in DB on "Place Order" (status: pending, payment_status: pending) → show QRIS → customer pays externally → taps "I've paid" → admin verifies bank app → confirms or cancels.

**Loyalty:** `floor(total / 10000) * 1` point. Credited on `completed` only. Deducted immediately on redeem.

**Mood engine (POST-MVP):** Engine accepts `(mood, catalog[])` → returns filtered products. NEVER reaches into Supabase directly. Industry-agnostic — knows nothing about TCS.

**Currency:** always `new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)`

---

## 10. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SHOP_ID=        # organizations.id for TCS Coffee
NEXT_PUBLIC_QRIS_IMAGE_URL= # static QRIS image URL
NEXT_PUBLIC_APP_URL=        # e.g. https://tcs-coffee.vercel.app
SUPABASE_SERVICE_ROLE_KEY=  # server-only, NEVER in NEXT_PUBLIC_*
```

---

## 11. What NOT To Do

```
❌ Pages Router — App Router only
❌ next-pwa — use @ducanh2912/next-pwa
❌ @supabase/auth-helpers-nextjs — use @supabase/ssr
❌ Auth tokens in localStorage — Supabase SSR handles cookies
❌ Supabase query without shop_id filter — every query scoped to shop
❌ SUPABASE_SERVICE_ROLE_KEY in client — server-only
❌ Class components — functional + hooks only
❌ Inline styles or hardcoded hex — use @theme token classes
❌ B2B UI — tables exist, zero frontend
❌ Delivery features — pickup + dine-in only
❌ Prisma/Drizzle — Supabase IS the database
❌ useEffect for data fetching — Server Components or SWR
❌ SHOP_ID hardcoded outside constants.ts
❌ Skip RLS — enable on every table
❌ Desktop-first — mobile (375px) is primary
❌ Vibe Mood UI in MVP — post-MVP only
❌ Mood engine API before white-label client #1
❌ Mood engine querying Supabase directly — accepts catalog as input
```

---

## 12. First Steps

@first-steps.md

---

## 13. Project Context

Solo frontend dev, strong Next.js, backend is new territory. Real client (friend's shop in Cirebon) + portfolio piece.
Ship working code. Mobile-first. Indonesian context. Warm + premium feel. Simple for non-technical shop owner.
Confirm with developer before adding anything not in this file.

---

*Version: 1.5 | May 2026 | In development*
