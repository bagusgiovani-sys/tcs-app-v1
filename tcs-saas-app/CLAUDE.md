# CLAUDE.md — TCS Coffee App

> This file is the single source of truth for this project. Read it entirely before writing a single line of code. Every architectural decision, convention, and constraint lives here. When in doubt, refer back to this file.

---

## 1. Project Overview

**TCS Coffee** (Think Coffee Smanda) is a mobile-first PWA ordering app for a local UMKM coffee shop in Cirebon, West Java, Indonesia.

### What this app does
- Gives TCS Coffee a **direct B2C ordering channel**, bypassing GoFood/GrabFood and their 15–30% commission
- Builds a **direct customer relationship** through loyalty points, vouchers, and personalized experience
- Provides a **lightweight POS** (cashier view) for walk-in orders
- Is **architected for B2B** (cafe-to-roastery ordering) as a future phase — the database supports it from day one, but zero B2B UI is built in MVP

### What this app is NOT
- Not a delivery app. No driver assignment, no delivery zones, no logistics.
- Not a marketplace. One shop only for MVP.
- Not a full POS system. The cashier view is lightweight (Option A POS).
- Not a B2B platform yet. The tables exist in the DB but no UI is built.

### Real-world context
- Customers in Cirebon share links via **WhatsApp** — the app must work perfectly when opened from a WhatsApp link on Android
- Payment at launch is **static QRIS** — the shop already has a QRIS code, we display it and the customer pays manually
- Midtrans (dynamic QRIS, GoPay, OVO, DANA, VA) is **post-MVP** pending NIB registration
- The shop currently uses **GoFood + walk-in + POS** — this app runs alongside, not replacing, GoFood initially

---

## 2. Architecture Decision Log

These decisions were made deliberately. Do not reverse them without strong reason.

| Decision | What | Why |
|---|---|---|
| Single codebase | Customer app + Admin + POS in one Next.js project | Solo dev, same DB, role-based routing |
| Multi-tenant DB from day 1 | `organizations` table is root for shops AND roasteries | B2B can be added without rebuilding |
| PWA not native app | Next.js PWA, not React Native or Flutter | Dev's existing expertise, ASAP delivery, shareable via WhatsApp link |
| Supabase | Backend, auth, DB, realtime, storage all-in-one | Solo dev can't maintain a separate backend |
| Static QRIS for MVP | Display shop's existing QRIS QR, manual confirmation | Zero new registration needed, works immediately |
| No separate admin app | Admin lives at `/admin/*` in same codebase | Same session, same types, less infra |
| TypeScript everywhere | Strict mode | Supabase generates types, catches errors early |
| Tailwind only | No styled-components, no CSS modules, no inline styles | Consistency, dark mode via CSS variables + `.dark` class |
| Zustand for cart | Not Supabase, not Context | Cart is ephemeral client state, not DB state |
| Tailwind v4 CSS-first | No `tailwind.config.js` — tokens in `@theme {}` in CSS | v4 is latest, CSS-first config is cleaner for our token strategy |
| next-pwa fork | `@ducanh2912/next-pwa` not `next-pwa` | Original `next-pwa` unmaintained since 2022, broken on Next 13+ |

---

## 3. Tech Stack

```
Frontend     Next.js (latest stable)
Styling      Tailwind CSS v4 (latest — CSS-first, no tailwind.config.js)
Animation    Framer Motion (latest)
State        Zustand (latest)
Backend      Supabase (latest)
PWA          @ducanh2912/next-pwa (latest) — NOT next-pwa
Hosting      Vercel (auto-deploy from main branch)
Payment MVP  Static QRIS (zero integration)
Payment v2   Midtrans (QRIS dynamic, GoPay, OVO, DANA, VA) — POST-MVP
```

### Version Policy — Check Before Installing

Before installing ANY package, run:
```bash
npm view [package-name] version
```
Verify the latest version is compatible with the rest of the stack before installing.
Use `latest` for everything EXCEPT the one package flagged below with a specific restriction.

| Package | Rule | Reason |
|---|---|---|
| `tailwindcss` | Use latest (v4) | CSS-first config, no tailwind.config.js |
| `next-pwa` | **NEVER install this** | Unmaintained since 2022. Use `@ducanh2912/next-pwa` instead |
| `@supabase/ssr` | Use latest | Backward compatible |
| `next` | Use latest stable | Check React version shipped with it |
| All others | Use latest | No known breaking issues |

### Key packages
```bash
npm install @supabase/ssr @supabase/supabase-js framer-motion zustand @ducanh2912/next-pwa
```

### Supabase client setup
- Use `@supabase/ssr` — NOT the legacy `@supabase/auth-helpers-nextjs`
- Server component client: `createServerClient` from `@supabase/ssr`
- Client component client: `createBrowserClient` from `@supabase/ssr`
- Middleware: refresh session on every request

---

## 4. Database Schema

### Critical: organizations is the root entity

```sql
-- ROOT ENTITY — covers both shops and roasteries
organizations
  id          uuid PK DEFAULT gen_random_uuid()
  type        text  -- 'shop' | 'roastery'
  name        text
  slug        text UNIQUE  -- e.g. 'tcs-coffee-cirebon'
  address     text
  city        text
  logo_url    text
  created_at  timestamptz DEFAULT now()
```

### Table Creation Order — IMPORTANT
Run SQL in this exact order to avoid foreign key constraint errors:
```
1.  organizations
2.  users               (FK → organizations)
3.  products            (FK → organizations)
4.  vouchers            (FK → organizations) ← MUST be before orders
5.  orders              (FK → organizations, users, vouchers)
6.  order_items         (FK → orders, products)
7.  loyalty_points      (FK → users, organizations)
8.  loyalty_transactions (FK → users, organizations, orders)
9.  voucher_uses        (FK → vouchers, users, orders)
10. wholesale_products  (FK → organizations) — B2B, create now, no UI
11. b2b_orders          (FK → organizations) — B2B, create now, no UI
12. b2b_order_items     (FK → b2b_orders, wholesale_products) — B2B
13. shop_roastery_rel   (FK → organizations) — B2B
```

### B2C MVP tables (build now)

```sql
users
  id          uuid PK DEFAULT gen_random_uuid()
  org_id      uuid FK → organizations  -- NULL for customers, set for staff/admin
  role        text  -- 'customer' | 'staff' | 'admin'
  name        text
  email       text UNIQUE
  phone       text
  avatar_url  text
  created_at  timestamptz DEFAULT now()

products
  id            uuid PK DEFAULT gen_random_uuid()
  shop_id       uuid FK → organizations
  name          text
  description   text
  price         numeric(10,2)
  category      text  -- 'coffee' | 'non-coffee' | 'food' | 'merchandise'
  image_url     text
  is_available  boolean DEFAULT true
  sort_order    integer DEFAULT 0
  created_at    timestamptz DEFAULT now()

vouchers
  id             uuid PK DEFAULT gen_random_uuid()
  shop_id        uuid FK → organizations
  code           text UNIQUE
  name           text
  discount_type  text  -- 'percentage' | 'fixed'
  value          numeric(10,2)
  min_order      numeric(10,2) DEFAULT 0
  max_uses       integer  -- NULL = unlimited
  used_count     integer DEFAULT 0
  is_active      boolean DEFAULT true
  expires_at     timestamptz  -- nullable = no expiry
  created_at     timestamptz DEFAULT now()

orders
  id              uuid PK DEFAULT gen_random_uuid()
  shop_id         uuid FK → organizations
  customer_id     uuid FK → users
  type            text  -- 'pickup' | 'dine_in'
  table_number    text  -- nullable, for dine_in only
  status          text  -- 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  payment_method  text  -- 'qris' | 'gopay' | 'ovo' | 'va' | 'cash'
  payment_status  text  -- 'pending' | 'paid'
  subtotal        numeric(10,2)
  discount        numeric(10,2) DEFAULT 0
  total           numeric(10,2)
  notes           text
  voucher_id      uuid FK → vouchers  -- nullable
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
  -- IMPORTANT: updated_at requires a trigger to auto-update on row changes.
  -- Create this in Supabase SQL editor after creating the table:
  -- CREATE OR REPLACE FUNCTION update_updated_at()
  -- RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
  -- CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  -- FOR EACH ROW EXECUTE FUNCTION update_updated_at();

order_items
  id          uuid PK DEFAULT gen_random_uuid()
  order_id    uuid FK → orders
  product_id  uuid FK → products
  quantity    integer
  unit_price  numeric(10,2)  -- snapshot at time of order, NOT the current product price
  subtotal    numeric(10,2)  -- quantity * unit_price
  notes       text  -- e.g. 'less sugar', 'no ice'
  created_at  timestamptz DEFAULT now()

loyalty_points
  id           uuid PK DEFAULT gen_random_uuid()
  customer_id  uuid FK → users
  shop_id      uuid FK → organizations
  points       integer DEFAULT 0
  created_at   timestamptz DEFAULT now()
  updated_at   timestamptz DEFAULT now()
  -- IMPORTANT: updated_at requires a trigger. Add after creating table:
  -- CREATE TRIGGER loyalty_points_updated_at BEFORE UPDATE ON loyalty_points
  -- FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  -- (update_updated_at function already created for the orders table — reuse it)
  UNIQUE (customer_id, shop_id)

loyalty_transactions
  id           uuid PK DEFAULT gen_random_uuid()
  customer_id  uuid FK → users
  shop_id      uuid FK → organizations
  order_id     uuid FK → orders  -- nullable for manual adjustments
  points       integer  -- positive = earn, negative = redeem
  type         text  -- 'earn' | 'redeem' | 'expire' | 'manual'
  note         text
  created_at   timestamptz DEFAULT now()

voucher_uses
  id          uuid PK DEFAULT gen_random_uuid()
  voucher_id  uuid FK → vouchers
  customer_id uuid FK → users
  order_id    uuid FK → orders
  used_at     timestamptz DEFAULT now()
```

### B2B tables (architect now, DO NOT build UI yet)

```sql
-- Create these tables now. Zero frontend code for these in MVP.

wholesale_products
  id              uuid PK DEFAULT gen_random_uuid()
  roastery_id     uuid FK → organizations
  name            text
  description     text
  unit            text  -- 'kg' | 'g' | 'bag'
  price_per_unit  numeric(10,2)
  min_qty         integer
  stock_qty       integer
  category        text  -- 'green_bean' | 'roasted_bean' | 'syrup' | 'equipment'
  image_url       text
  is_available    boolean DEFAULT true
  created_at      timestamptz DEFAULT now()

b2b_orders
  id                  uuid PK DEFAULT gen_random_uuid()
  buyer_shop_id       uuid FK → organizations
  seller_roastery_id  uuid FK → organizations
  status              text  -- 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_terms       text  -- 'immediate' | 'net_7' | 'net_30'
  payment_status      text  -- 'unpaid' | 'partial' | 'paid'
  total               numeric(10,2)
  notes               text
  created_at          timestamptz DEFAULT now()

b2b_order_items
  id              uuid PK DEFAULT gen_random_uuid()
  b2b_order_id    uuid FK → b2b_orders
  product_id      uuid FK → wholesale_products
  quantity        integer
  unit_price      numeric(10,2)
  subtotal        numeric(10,2)
  created_at      timestamptz DEFAULT now()

shop_roastery_rel
  id            uuid PK DEFAULT gen_random_uuid()
  shop_id       uuid FK → organizations
  roastery_id   uuid FK → organizations
  pricing_tier  text DEFAULT 'standard'  -- 'standard' | 'preferred' | 'vip'
  credit_limit  numeric(10,2) DEFAULT 0
  is_active     boolean DEFAULT true
  created_at    timestamptz DEFAULT now()
  UNIQUE (shop_id, roastery_id)
```

### Row Level Security — critical rules
- Every table with `shop_id` must have RLS enabled
- Customers can only read their own orders and loyalty data
- Staff/admin can read all data for their `org_id`
- Public can read `products` and `organizations` (for menu browsing without login)
- Never expose other shops' data

---

## 5. Project Structure

```
tcs-coffee/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (customer)/              ← customer-facing app
│   │   ├── layout.tsx           ← bottom nav, auth guard (allow guest browse)
│   │   ├── page.tsx             ← home: featured items, promo banner, loyalty card
│   │   ├── menu/
│   │   │   └── page.tsx         ← full menu, category filter
│   │   ├── product/
│   │   │   └── [id]/
│   │   │       └── page.tsx     ← product detail, customization, add to cart
│   │   ├── cart/
│   │   │   └── page.tsx         ← cart review, voucher input
│   │   ├── checkout/
│   │   │   └── page.tsx         ← order type, notes, payment method, QRIS display
│   │   ├── order/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     ← order status, realtime updates
│   │   │   └── history/
│   │   │       └── page.tsx     ← order history list
│   │   └── loyalty/
│   │       └── page.tsx         ← points balance, transaction history, vouchers
│   │
│   ├── admin/                   ← admin dashboard (owner)
│   │   ├── layout.tsx           ← sidebar nav, admin auth guard (role: admin)
│   │   ├── page.tsx             ← dashboard: live orders, today's revenue
│   │   ├── orders/
│   │   │   └── page.tsx         ← order queue, status management
│   │   ├── menu/
│   │   │   ├── page.tsx         ← product list
│   │   │   └── [id]/
│   │   │       └── page.tsx     ← add/edit product
│   │   ├── vouchers/
│   │   │   └── page.tsx         ← create/manage vouchers
│   │   └── loyalty/
│   │       └── page.tsx         ← loyalty program settings
│   │
│   ├── pos/                     ← cashier view (staff)
│   │   ├── layout.tsx           ← minimal layout, staff auth guard (role: staff | admin)
│   │   └── page.tsx             ← order builder, QRIS display, mark as paid
│   │
│   ├── layout.tsx               ← root layout: theme provider, fonts
│   ├── globals.css              ← Tailwind v4 @import, @custom-variant, @theme tokens
│   └── manifest.json            ← PWA manifest
│
├── components/
│   ├── ui/                      ← base components (Button, Input, Badge, Sheet, etc.)
│   ├── customer/                ← customer-facing components
│   │   ├── ProductCard.tsx
│   │   ├── CartItem.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   ├── LoyaltyCard.tsx
│   │   ├── QRISDisplay.tsx
│   │   └── BottomNav.tsx
│   ├── admin/                   ← admin components
│   │   ├── OrderCard.tsx
│   │   ├── OrderQueue.tsx
│   │   ├── ProductForm.tsx
│   │   └── Sidebar.tsx
│   └── pos/                     ← POS components
│       ├── MenuGrid.tsx
│       ├── OrderBuilder.tsx
│       └── POSQRISModal.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts            ← createBrowserClient
│   │   ├── server.ts            ← createServerClient
│   │   └── types.ts             ← generated DB types (supabase gen types)
│   ├── stores/
│   │   └── cart.ts              ← Zustand cart store
│   ├── hooks/
│   │   ├── useCart.ts
│   │   ├── useOrders.ts         ← realtime order subscription
│   │   └── useAuth.ts
│   └── utils/
│       ├── currency.ts          ← formatRupiah(amount) → "Rp 25.000"
│       ├── loyalty.ts           ← points calculation logic
│       └── orders.ts            ← order status helpers
│
├── middleware.ts                ← Supabase session refresh + route protection
├── next.config.ts               ← PWA config (@ducanh2912/next-pwa, TypeScript)
└── CLAUDE.md                    ← this file
```

---

## 6. Auth & Role System

### Three roles
```
customer  → can: browse menu, place orders, view own orders, earn/redeem loyalty
staff     → can: everything customer can + access /pos route
admin     → can: everything staff can + access /admin/* routes
```

### Route protection rules
```
/                → public (no auth required to browse)
/menu            → public
/product/*       → public
/cart            → requires auth (to place order)
/checkout        → requires auth
/order/*         → requires auth (own orders only)
/loyalty         → requires auth
/admin/*         → requires auth + role: admin
/pos             → requires auth + role: staff OR admin
/auth/login      → redirect to home if already authed
/auth/register   → redirect to home if already authed
```

### Middleware logic (middleware.ts)
```typescript
// 1. Refresh Supabase session on every request
// 2. If accessing /admin/* and role !== 'admin' → redirect to /
// 3. If accessing /pos and role !== 'staff' and role !== 'admin' → redirect to /
// 4. If accessing /cart, /checkout, /order/* and no session → redirect to /auth/login?redirectTo=[current path]
// 5. After login, read redirectTo param and send user back to original destination
```

### Getting the current user's role
```typescript
// In server components:
const { data: user } = await supabase
  .from('users')
  .select('role, org_id')
  .eq('id', session.user.id)
  .single()

// Never trust client-side role claims. Always verify from DB in server components.
```

---

## 7. Design System

### Palette — Tailwind v4 CSS-first tokens

Tailwind v4 has no `tailwind.config.js`. All tokens are defined in `globals.css` using `@theme`.

```css
/* globals.css */
@import "tailwindcss";

/* Dark mode using class strategy */
@custom-variant dark (&:where(.dark, .dark *));

/* Design tokens — available as Tailwind utilities automatically */
/* e.g. bg-brand-bg, text-brand-text, border-brand-border */
@theme {
  --color-brand-bg:      #FAF7F2;
  --color-brand-surface: #F0EBE0;
  --color-brand-card:    #FFFFFF;
  --color-brand-border:  #E0CCB0;
  --color-brand-muted:   #E8D5B8;
  --color-brand-text:    #1A0F0A;
  --color-brand-subtext: #7A4A2A;
  --color-brand-accent:  #8B4513;

  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

/* Dark mode token overrides */
.dark {
  --color-brand-bg:      #1A0F0A;
  --color-brand-surface: #2C1A10;
  --color-brand-card:    #2C1A10;
  --color-brand-border:  #3D2718;
  --color-brand-text:    #F5EDD8;
  --color-brand-subtext: #C8902E;
  --color-brand-accent:  #C8902E;
}
```

### Dark mode
- Uses `@custom-variant dark` in globals.css — replaces `darkMode: 'class'` from v3
- Toggle by adding/removing `dark` class on `<html>`
- Persist preference in `localStorage` key `tcs-theme`
- Default: system preference (`prefers-color-scheme`)
- Every component must look correct in BOTH modes
- **FOUC prevention:** Add an inline `<script>` in root `layout.tsx` that reads localStorage and applies the `dark` class BEFORE hydration, otherwise users see a flash of the wrong theme on load:
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  const theme = localStorage.getItem('tcs-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (theme === 'dark' || (!theme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
`}} />
```

### Typography
- Primary font: **Plus Jakarta Sans** (Google Fonts) — modern, warm, readable
- Mono font: **JetBrains Mono** — for order numbers, codes only
- Scale: Tailwind defaults (text-xs through text-4xl)
- Never use system fonts as primary. Import Plus Jakarta Sans in root layout.

### Mobile-first
- Base styles: 375px (iPhone SE / most Indonesian Androids)
- Breakpoints: sm: 640px, md: 768px (tablet admin view)
- Max content width on mobile: 430px, centered on larger screens
- Bottom navigation bar on customer app (fixed, 64px height)
- Always test thumb reach — primary actions should be in bottom 40% of screen

### Component conventions
```tsx
// ✅ Correct — token handles dark mode automatically, NO dark: prefix needed
// .dark overrides in globals.css change the CSS variable itself
<div className="bg-brand-bg border border-brand-border rounded-2xl p-4">

// ✅ Only use dark: for non-token utilities
<div className="opacity-100 dark:opacity-80">

// ❌ Wrong — redundant, CSS variable already handles this
<div className="bg-brand-bg dark:bg-brand-bg">

// ❌ Wrong — no hardcoded hex values
<div style={{ backgroundColor: '#FAF7F2' }}>

// ❌ Wrong — no arbitrary color values
<div className="bg-[#FAF7F2]">

// ✅ Correct — mobile-first
<div className="px-4 md:px-6">

// ❌ Wrong — desktop-first
<div className="px-6 sm:px-4">
```

---

## 8. MVP Feature Scope

### ✅ IN scope for MVP

**Customer App:**
- [ ] Onboarding splash + register/login (email or phone)
- [ ] Home screen: promo banner, featured products, loyalty points mini-card
- [ ] Menu: product grid with category filter tabs
- [ ] Product detail: photo, description, price, notes input, add to cart
- [ ] Cart: item list, quantity adjust, remove, voucher code input, total
- [ ] Checkout: order type selector (pickup / dine-in + table number), notes, payment method display, order placement
- [ ] QRIS payment: display static QRIS image, "I've paid" confirmation button
- [ ] Order status: realtime status (pending → confirmed → preparing → ready → completed)
- [ ] Order history: list of past orders
- [ ] Loyalty: points balance, transaction history
- [ ] Vouchers: available vouchers card on loyalty page
- [ ] Light/dark mode toggle

**Admin Dashboard:**
- [ ] Login (admin role only)
- [ ] Dashboard: incoming orders queue, live count, today's revenue
- [ ] Order management: view details, change status (confirm/prepare/ready/complete/cancel)
- [ ] Menu management: product list, add product, edit product, toggle availability
- [ ] Voucher management: create voucher, view active vouchers, deactivate
- [ ] Loyalty settings: points per order value, redemption rate

**POS — Cashier View:**
- [ ] Login (staff or admin role)
- [ ] Menu grid: all available products, tap to add
- [ ] Order builder: running order, quantity, notes
- [ ] Order type: pickup or dine-in
- [ ] Payment: show QRIS for customer to scan
- [ ] Mark as paid: fires order to same DB as customer orders
- [ ] Clear and start new order

### ❌ OUT of scope for MVP (do not build)

- Delivery / driver assignment / delivery zones
- Multiple shops / shop switcher
- B2B features (tables exist in DB, zero UI)
- Midtrans dynamic payment integration
- Push notifications — add post-MVP
- Play Store publishing — add post-MVP
- Inventory management / stock tracking
- Staff management / shift reports
- Full sales analytics / charts
- Customer profile editing
- Social login (Google, etc.)
- In-app chat / support
- Product reviews / ratings

---

## 9. Key Business Logic

### Order flow
```
Customer places order → status: 'pending'
Admin confirms → status: 'confirmed'
Staff starts making → status: 'preparing'
Order ready → status: 'ready'
Customer picks up → status: 'completed'
```

### Payment flow (MVP — Static QRIS)
```
1. Customer reviews cart → taps "Place Order"
2. Order row IS CREATED in DB immediately
   → status: 'pending', payment_status: 'pending'
3. App navigates to payment screen — shows static QRIS image
4. Customer opens e-wallet (GoPay, OVO, DANA, etc.)
5. Customer scans QR and pays manually via their e-wallet
6. Customer taps "I've paid" in the app
7. UI shows "waiting for confirmation" state
8. Admin receives order in dashboard, checks their bank app to verify
9. Admin confirms order → status: 'confirmed', payment_status: 'paid'
   OR Admin rejects → status: 'cancelled' if unpaid
10. Customer sees realtime status update
```

### Loyalty points logic
```typescript
const POINTS_PER_10K = 1  // 1 point per Rp 10,000 spent

function calculatePointsEarned(orderTotal: number): number {
  return Math.floor(orderTotal / 10000) * POINTS_PER_10K
}

// Points credited ONLY when order status → 'completed'
// Points deducted immediately when redeemed at checkout
```

### Voucher validation
```typescript
// Check in order: valid code → active → not expired → min order met → uses not exceeded
// Apply discount: percentage or fixed
// Record use in voucher_uses table after order is placed
```

### Realtime — Admin order queue
```typescript
// Subscribe to orders where shop_id = current shop
// and status IN ('pending', 'confirmed', 'preparing')
// Use Supabase Realtime channel
// Play a sound notification (browser Audio API) on new order
// Badge count on browser tab title
```

### Currency formatting
```typescript
// Always use this function. Never format currency inline.
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
  // Output: "Rp 25.000"
}
```

---

## 10. Supabase Conventions

### Client usage
```typescript
// lib/supabase/server.ts — for Server Components, Server Actions, Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      }
    }
  )
}

// lib/supabase/client.ts — for Client Components only
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Always filter by shop_id
```typescript
// ✅ Correct
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('shop_id', SHOP_ID)
  .eq('is_available', true)

// ❌ Wrong — exposes all shops' data
const { data } = await supabase.from('products').select('*')
```

### SHOP_ID constant
```typescript
// lib/utils/constants.ts
export const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID!
```

### Type generation
```bash
npx supabase login  # only needed once per machine
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

### Image uploads (menu photos)
```typescript
// Bucket: 'product-images'
// Path: products/{shop_id}/{product_id}.webp
// Always convert to WebP before upload
// Public bucket — no auth needed to read
```

---

## 11. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SHOP_ID=           # organizations.id for TCS Coffee
NEXT_PUBLIC_QRIS_IMAGE_URL=    # URL to TCS's static QRIS code image
NEXT_PUBLIC_APP_URL=           # e.g. https://tcs-coffee.vercel.app (for WhatsApp share links)
SUPABASE_SERVICE_ROLE_KEY=     # server-only, never expose to client
```

---

## 12. Coding Conventions

### TypeScript
```typescript
// ✅ Always type Supabase responses
const { data, error } = await supabase
  .from('orders').select('*').eq('id', id).single()
if (error) throw error

// ✅ Use generated types
import type { Database } from '@/lib/supabase/types'
type Order = Database['public']['Tables']['orders']['Row']

// ❌ Never use 'any'
```

### Server vs Client components
```typescript
// Default to Server Components (no 'use client')
// Add 'use client' ONLY when you need:
// - useState / useEffect
// - Browser APIs (localStorage, Audio, etc.)
// - Event handlers that can't be server actions
// - Framer Motion animations
// - Zustand store
```

### Error handling
```typescript
const { data, error } = await supabase.from('orders').select()
if (error) {
  console.error('Failed to fetch orders:', error.message)
  // Show user-friendly toast, not raw error
}
// Never silently swallow errors
```

### Loading states
```typescript
// Use Suspense boundaries for server components
// Use local useState for client-side async
// Show skeleton loaders, not spinners, for content areas
```

### Naming
```
Components:    PascalCase       (ProductCard.tsx)
Hooks:         camelCase        (useCart.ts)
Utils:         camelCase        (formatRupiah)
DB tables:     snake_case       (order_items)
Route files:   lowercase        (page.tsx)
Constants:     SCREAMING_SNAKE  (SHOP_ID)
```

---

## 13. What NOT To Do

```
❌ Do NOT use the Pages Router (/pages directory)
   Use App Router (/app directory) exclusively.

❌ Do NOT install next-pwa
   It is unmaintained since 2022 and broken on Next 13+. Use @ducanh2912/next-pwa.

❌ Do NOT use @supabase/auth-helpers-nextjs
   Deprecated. Use @supabase/ssr.

❌ Do NOT store auth tokens in localStorage
   Supabase SSR handles cookies automatically.

❌ Do NOT query Supabase without shop_id filter
   Every data query must be scoped to the current shop.

❌ Do NOT expose SUPABASE_SERVICE_ROLE_KEY to client
   Server-only. Never put it in NEXT_PUBLIC_*.

❌ Do NOT use class components
   Functional components with hooks only.

❌ Do NOT use inline styles or hardcoded hex values in components
   Use @theme token names as Tailwind classes (e.g. bg-brand-bg, text-brand-text).

❌ Do NOT build B2B UI
   Tables exist in schema but zero frontend for B2B in MVP.

❌ Do NOT build delivery features
   Pickup + dine-in only.

❌ Do NOT add a second database or ORM
   Supabase IS the database. No Prisma, no Drizzle.

❌ Do NOT use useEffect for data fetching
   Use Server Components or React Query / SWR.

❌ Do NOT hardcode shop name or ID outside constants.ts
   Everything references SHOP_ID from env.

❌ Do NOT skip RLS
   Enable Row Level Security on every table.

❌ Do NOT build desktop-first
   Mobile (375px) is the primary viewport.
```

---

## 14. Deployment

### Vercel setup
- Connect GitHub repo to Vercel
- Set all env vars in Vercel dashboard
- Branch `main` → production
- Branch `dev` → preview deployments

### PWA (@ducanh2912/next-pwa)
```typescript
// next.config.ts — ES modules, TypeScript
import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = {
  // add any Next.js config here
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

### PWA manifest (app/manifest.json)
```json
{
  "name": "TCS Coffee",
  "short_name": "TCS Coffee",
  "description": "Order your favorite coffee from TCS Coffee Cirebon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAF7F2",
  "theme_color": "#1A0F0A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 15. First Steps (in order)

```
1.  npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
2.  Check installed versions: npx next --version && npx tailwindcss --version
3.  Install packages:
    npm install @supabase/ssr @supabase/supabase-js framer-motion zustand @ducanh2912/next-pwa

--- FIGMA FIRST — before any components or backend ---

4.  Extract design tokens — choose one path:

    **Path A — Figma (if you have a design file):**
    Open Figma. Extract every token:
    - All colors (light + dark mode)
    - All font sizes, weights, line heights
    - All spacing values
    - Border radius, shadow values
    - Component states (default, hover, active, disabled, error)
    Use the Figma MCP (share file link → Claude extracts tokens via `get_design_context`).

    **Path B — Claude Design (no Figma / not satisfied with your Figma):**
    Describe the brand feel to Claude (warm, premium, local, Indonesian, coffee).
    Claude generates a full token set directly — colors, typography, spacing, states.
    Review and adjust before writing globals.css.
    The token set in `[[CLAUDE.md#7. Design System]]` was produced this way.

5.  Overwrite globals.css (create-next-app already generated one — replace ALL its content):
    @import "tailwindcss", @custom-variant dark, @theme {} with ALL tokens from step 4,
    .dark {} overrides, FOUC prevention script in root layout.tsx (see Section 7).

6.  Build component inventory from Figma:
    - Go through every screen in Figma
    - List every reusable component (ProductCard, Button, Badge, BottomNav, etc.)
    - Sort by reuse frequency — most reused components built first
    - Do NOT write code yet — just the list

--- BACKEND ---

7.  Set up Supabase project. Create all tables from Section 4 IN THE ORDER LISTED. Enable RLS.
8.  Create organization row for TCS Coffee. Note the UUID.
9.  Set up .env.local with all variables from Section 11.
10. Configure middleware.ts for session refresh and route protection.
11. Set up lib/supabase/client.ts and lib/supabase/server.ts.
12. Log in to Supabase CLI: npx supabase login
    Then generate types: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
13. Seed real data: at minimum 1 organization row + 6–8 products across categories.

--- COMPONENTS (no data, pure presentational) ---

14. Build /components/ui/ — Button, Input, Badge, Card, Sheet, Skeleton, Toast.
    These accept props only. Zero Supabase queries. Zero data fetching.

15. Build customer feature components — ProductCard, CartItem, OrderStatusBadge,
    LoyaltyCard, QRISDisplay, BottomNav, CategoryTabs.
    Accept props only. No data fetching inside components.

16. Build admin feature components — OrderCard, OrderQueue, ProductForm, Sidebar, StatCard.
17. Build POS components — MenuGrid, OrderBuilder, POSQRISModal.

--- PAGES (wire components to real data) ---

18. Build auth pages (/auth/login, /auth/register).
19. Build customer layout with bottom nav.
20. Build menu + product pages (public, Server Component, real Supabase data).
21. Build cart (Zustand store).
22. Build checkout + QRIS display.
23. Build order status page (Supabase Realtime).
24. Build admin layout + order queue.
25. Build POS view.
26. Build loyalty + vouchers.

--- POLISH + DEPLOY ---

27. PWA config, manifest, icons.
28. Dark mode polish pass — verify every component in both modes.
29. Full QA on mobile viewport (375px).
30. Deploy to Vercel.
```

---

## 16. Project Context for Claude Code

Solo frontend developer, strong Next.js experience, backend is new territory.
Building for a real client (friend's coffee shop in Cirebon) and as a portfolio piece.

- **Ship working code** — working MVP on time beats perfect code late
- **Mobile-first always** — 90%+ of users on Android via WhatsApp links
- **Indonesian context** — currency IDR, language Bahasa Indonesia, payment QRIS
- **Warm + premium feel** — premium local brand, not generic app
- **Simple for shop owner** — admin UI must work for a non-technical user
- **Honest about scope** — confirm with developer before adding anything not in this file

---

*Last updated: May 2026 | Version: 1.3 | Status: Ready to build*
