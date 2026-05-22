# Fix Log
> All changes made by /Ultra-Instinct sessions.
> Append-only. Never edit existing entries.

---

## [2026-05-22] Cart badge permanently invisible
#QUAL #framer-motion
**File(s) changed:**
- `components/customer/BottomNav.tsx:152` — `animate={{ scale: 0 }}` → `animate={{ scale: 1 }}`

**Before:** Badge initialised at scale 0 and animated back to scale 0. Always hidden.
**After:** Animates to scale 1. Badge now appears when cart has items.
**Linked step:** [[ultra-progress.md#Milestone 1]]

---

## [2026-05-22] POS missing shop_id filter + order_items error handling
#ARCH #supabase
**File(s) changed:**
- `app/pos/_components/POSClient.tsx:86` — added `.eq('shop_id', SHOP_ID)` to handleConfirm update
- `app/pos/_components/POSClient.tsx:67` — added error check + order rollback on order_items insert failure

**Before:** Status update had no shop scope. Insert failure silently orphaned the order.
**After:** Scoped to shop. On insert failure, order is deleted before returning.
**Linked step:** [[ultra-progress.md#Milestone 1]]

---

## [2026-05-22] FOUC script crashes in private browsing
#ARCH #security
**File(s) changed:**
- `app/layout.tsx:48` — wrapped localStorage access in try/catch

**Before:** Unguarded localStorage call; throws in private browsing / storage-blocked browsers.
**After:** Silent catch — page renders with default (light) theme on localStorage error.
**Linked step:** [[ultra-progress.md#Milestone 1]]

---

## [2026-05-22] Delete dead code: ProductForm.tsx + nextjs-splash/
#CHORE #dead-code
**File(s) changed:**
- `components/admin/ProductForm.tsx` — deleted (unused callback-API duplicate of AdminProductForm)
- `nextjs-splash/` — deleted entire directory (template copy, not imported)

**Before:** Unused files confusing repo structure. 7 files of dead weight.
**After:** Removed. AdminProductForm.tsx is the single source of truth.
**Linked step:** [[ultra-progress.md#Milestone 2]]

---

## [2026-05-22] Sidebar dead routes removed
#ARCH
**File(s) changed:**
- `components/admin/Sidebar.tsx:10–11` — removed `/admin/vouchers` and `/admin/loyalty` nav items

**Before:** Clicking Voucher or Loyalty in admin nav → 404.
**After:** Only Dashboard, Pesanan, Menu shown. Add back when pages exist.
**Linked step:** [[ultra-progress.md#Milestone 2]]

---

## [2026-05-22] Profile order history dead row → real Link
#QUAL
**File(s) changed:**
- `app/(customer)/profile/_components/ProfileClient.tsx:100` — `<div>` → `<Link href="/order/history">`

**Before:** Row looked tappable, did nothing. UX lie.
**After:** Navigates to order history (page to be built).
**Linked step:** [[ultra-progress.md#Milestone 2]]

---

## [2026-05-22] `<a>` → `<Link>` for loyalty in ProfileClient
#QUAL
**File(s) changed:**
- `app/(customer)/profile/_components/ProfileClient.tsx:115` — `<a href>` → `<Link href>`

**Before:** Full page reload on tap.
**After:** Client-side navigation.
**Linked step:** [[ultra-progress.md#Milestone 2]]

---

## [2026-05-22] CoffeeRadarChart hardcoded hex → CSS vars
#QUAL #design-tokens
**File(s) changed:**
- `components/customer/CoffeeRadarChart.tsx:71,78` — `#F4B942` → `var(--color-brand-accent)`, `rgba(244,185,66,0.22)` → fill + fillOpacity separate attrs

**Before:** Radar chart always used mustard yellow regardless of dark/vibe mode.
**After:** Uses brand-accent token — adapts to all four theme states.
**Linked step:** [[ultra-progress.md#Milestone 3]]

---

## [2026-05-22] Admin dashboard revenue via DB aggregate RPC
#PERF #supabase
**File(s) changed:**
- `app/admin/page.tsx:13` — replaced `.select('total')` + JS reduce with `supabase.rpc('sum_completed_revenue', ...)`

**Before:** Fetched every completed order's `total` column and summed in JavaScript.
**After:** Single scalar returned from DB. Zero row transfer cost.
**Linked step:** [[ultra-progress.md#Milestone 2]]

---

## [2026-05-22] users table trigger + backfill (Supabase SQL)
#ARCH #supabase
**File(s) changed:**
- Supabase DB: `handle_new_user()` function + `on_auth_user_created` trigger on `auth.users`
- Supabase DB: backfill INSERT for existing auth users missing a `public.users` row

**Before:** `register()` action created auth user only. All `users.name` queries returned null.
**After:** Every new signup auto-creates a `users` row with name from metadata and role='customer'.
**Linked step:** [[ultra-progress.md#Milestone 3]]
