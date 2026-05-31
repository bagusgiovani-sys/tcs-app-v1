# Improvement Progress
> Initiated: 2026-05-22 | Last updated: 2026-05-22
> Read this at the start of every Ultra-Instinct session before touching any file.

## Status Legend
- [ ] Pending
- [~] In Progress
- [x] Done

---

## Milestone 1 — Critical Fixes (do first)

- [x] **[QUAL]** Cart badge permanently invisible — `components/customer/BottomNav.tsx:152` — `animate={{ scale: 0 }}` should be `animate={{ scale: 1 }}`
- [x] **[ARCH]** POS `handleConfirm` missing shop_id filter — `app/pos/_components/POSClient.tsx:86` — add `.eq('shop_id', SHOP_ID)`
- [x] **[ARCH]** POS order_items insert has no error handling — `app/pos/_components/POSClient.tsx:67` — add rollback on insert failure (same pattern as checkout fix)
- [x] **[ARCH]** FOUC script crashes in private browsing — `app/layout.tsx:48` — wrap localStorage access in try/catch

## Milestone 2 — Major Improvements

- [x] **[CHORE]** Delete `components/admin/ProductForm.tsx` — dead code, superseded by `AdminProductForm.tsx`
- [x] **[CHORE]** Delete `nextjs-splash/` root directory — template copy, not imported anywhere
- [x] **[ARCH]** Sidebar dead routes — `components/admin/Sidebar.tsx:10–11` — remove `/admin/vouchers` and `/admin/loyalty` until pages exist
- [x] **[QUAL]** Profile "Riwayat Pesanan" dead row — `app/(customer)/profile/_components/ProfileClient.tsx:100` — add Link to `/order/history`
- [x] **[PERF]** Admin dashboard revenue uses JS reduce — `app/admin/page.tsx:13` — `sum_completed_revenue` RPC deployed + wired
- [x] **[QUAL]** `<a>` → `<Link>` in ProfileClient — `ProfileClient.tsx:115` — causes full page reload

## Milestone 3 — Quality & Polish

- [x] **[QUAL]** CoffeeRadarChart hardcoded hex — `components/customer/CoffeeRadarChart.tsx:71,72,78` — replace `#F4B942` with `var(--color-brand-accent)`
- [x] **[ARCH]** Missing `users` table trigger — SQL deployed: `handle_new_user()` trigger + backfill run

---

## Session Log
| Session | Date       | Steps completed                         | Token % at close | Notes |
|---------|------------|-----------------------------------------|-----------------|-------|
| 1       | 2026-05-22 | Full audit + all 12 items complete      | ~90%            | All milestones done |
| 2       | 2026-05-31 | Fresh audit + M4/M5/M6 all complete    | ~60%            | 7 fixes: token bug, qty UX, shop_id sec, error handling, any types, manifest |

---

## Session 2 Audit — New Findings (2026-05-31)

## Milestone 4 — Critical Fixes (fresh session)

- [x] **[QUAL]** BottomNav active label uses `var(--color-muted)` (undefined token) — `components/customer/BottomNav.tsx:144` — fixed to `var(--color-brand-muted)`
- [x] **[UX]** ProductDetail qty selector is decorative only — `app/(customer)/product/[id]/_components/ProductDetail.tsx:38-46` — updated cart store to accept optional `quantity`, wired qty into `handleAddToCart`

## Milestone 5 — Major Improvements

- [x] **[SEC]** `order/[id]/page.tsx:43` missing `shop_id` filter — added `.eq('shop_id', SHOP_ID)` + imported SHOP_ID
- [x] **[QUAL]** `checkout/page.tsx:86` `handleConfirmPayment` has no error handling — added error state + user message
- [x] **[QUAL]** `any` types in Supabase data — `app/(customer)/loyalty/page.tsx`, `app/(customer)/order/history/page.tsx` — replaced with typed inline interfaces

## Milestone 6 — Minor Polish

- [x] **[CHORE]** `app/manifest.ts:11` `background_color` synced to `#FBE3C2` (matches globals.css)

---

## Action Required (user, not auto-fixable)

- **[DB] Apply RLS SQL to Supabase** — file ready at `supabase-fix-products-public.sql`, paste into Supabase SQL Editor. Products won't show on home page until this runs.
- **[DEPLOY] Vercel** — connect repo and deploy when ready.

---

## Current Status
**Last completed:** Session 1 — all 12 items
**Currently working on:** —
**Next action:** Apply Supabase RLS SQL, then Vercel deploy
