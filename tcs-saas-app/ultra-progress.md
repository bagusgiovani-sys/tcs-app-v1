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

---

## Current Status
**Last completed:** M2-5 admin revenue RPC + M3-2 users trigger SQL
**Currently working on:** —
**Next action:** All Ultra-Instinct items resolved. Resume normal build from first-steps.md.
