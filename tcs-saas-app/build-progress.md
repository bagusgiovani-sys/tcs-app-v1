# Build Progress — TCS Coffee App
> Started: 2026-05-15 | Last updated: 2026-11-15
> Main project tracker: read Current Status and the Next Execution Plan before starting work.
> The original 30-step checklist below is historical implementation progress, not proof of production readiness.

## Status Legend
- [ ] Pending
- [~] In Progress
- [x] Done

---

## Phase 1 — Project Setup

- [x] Step 1: `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
- [x] Step 2: Check installed versions: `npx next --version && npx tailwindcss --version`
- [x] Step 3: Install packages: `npm install @supabase/ssr @supabase/supabase-js framer-motion zustand @ducanh2912/next-pwa`

---

## Phase 2 — Figma First (before any components or backend)

- [x] Step 4: Extract design tokens — **Path A:** Figma MCP (share file link, Claude extracts via `get_design_context`) **OR Path B:** Claude Design (describe brand to Claude, Claude generates token set). See [[CLAUDE.md#12. First Steps]] for both paths.
- [x] Step 5: Overwrite `globals.css` (replace ALL content from create-next-app): add `@import "tailwindcss"`, `@custom-variant dark`, `@theme {}` with ALL tokens from Step 4, `.dark {}` overrides. Add FOUC prevention script in root `layout.tsx` (see Section 7).
- [x] Step 6: Build component inventory from Figma — go through every screen, list every reusable component (ProductCard, Button, Badge, BottomNav, etc.), sort by reuse frequency. Do NOT write code yet — just the list.

---

## Phase 3 — Backend

- [x] Step 7: Set up Supabase project. Create all tables from schema.md IN THE ORDER LISTED. Enable RLS on every table.
- [x] Step 8: Create organization row for TCS Coffee. Note the UUID.
- [x] Step 9: Set up `.env.local` with all variables from CLAUDE.md Section 10.
- [x] Step 10: Configure `middleware.ts` for session refresh and route protection (see Section 6 pseudocode).
- [x] Step 11: Set up `lib/supabase/client.ts` and `lib/supabase/server.ts` (see schema.md Supabase Clients section).
- [x] Step 12: Log in to Supabase CLI (`npx supabase login`), then generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts`
- [x] Step 13: Seed real data — at minimum 1 organization row + 6–8 products across categories.

---

## Phase 4 — Components (presentational only, no data fetching)

- [x] Step 14: Build `/components/ui/` — Button, Input, Badge, Card, Sheet, Skeleton, Toast. Accept props only. Zero Supabase queries.
- [x] Step 15: Build customer feature components — ProductCard, CartItem, OrderStatusBadge, LoyaltyCard, QRISDisplay, BottomNav, CategoryTabs. Accept props only. No data fetching inside components.
- [x] Step 16: Build admin feature components — OrderCard, OrderQueue, ProductForm, Sidebar, StatCard. Accept props only.
- [x] Step 17: Build POS components — MenuGrid, OrderBuilder, POSQRISModal. Accept props only.

---

## Phase 5 — Pages (wire components to real data)

- [x] Step 18: Build auth pages (`/auth/login`, `/auth/register`).
- [x] Step 19: Build customer layout with bottom nav (`app/(customer)/layout.tsx` + `BottomNav`).
- [x] Step 20: Build menu + product pages (public, Server Component, real Supabase data).
- [x] Step 21: Build cart (Zustand store in `lib/stores/cart.ts`).
- [x] Step 22: Build checkout + QRIS display.
- [x] Step 23: Build order status page (Supabase Realtime subscription).
- [x] Step 24: Build admin layout + order queue.
- [x] Step 25: Build POS view.
- [x] Step 26: Build loyalty + vouchers.

---

## Phase 6 — Polish & Deploy

- [x] Step 27: PWA config (`next.config.ts`), manifest (`app/manifest.ts`), icons (`public/icons/icon-192.png` + `icon-512.png`).
- [x] Step 28: Dark mode polish pass — verify every component in all 4 theme states (TCS light, TCS dark, Vibe light, Vibe dark).
- [x] Step 29: Full QA on mobile viewport (375px) — test thumb reach, WhatsApp link open.
- [ ] Step 30: Deploy to Vercel. Set all env vars in Vercel dashboard.

---

## Session Log

| Session | Date       | Steps completed | Token % at close | Notes |
|---------|------------|-----------------|-----------------|-------|
| 1       | 2026-05-15 | —               | —               | Scaffold files generated |
| 2       | 2026-05-15 | —               | —               | CLAUDE.md updated to v1.3; build-progress regenerated for 30-step plan |
| 3       | 2026-05-15 | Steps 1–3       | —               | ultra-learn activated; project scaffolded, versions verified, packages installed |
| 4       | 2026-05-21 | Steps 4–6       | —               | Figma tokens extracted via MCP; globals.css written; 27-component inventory in design.md |
| 5       | 2026-05-21 | Steps 7–27      | —               | Full build: Supabase, components, pages, PWA |
| 6       | 2026-05-21 | Step 28         | —               | Dark mode QA: all 4 themes pass. Fixed: deleted boilerplate app/page.tsx, added suppressHydrationWarning. Note: products empty — verify RLS public policy in Supabase dashboard |
| 7       | 2026-05-22 | Step 29         | —               | Mobile QA pass. Fixes: created /order/history page (dead link), WhatsApp share in Profile, viewport-fit=cover, BottomNav safe-area-inset-bottom, ProductCard text-white→text-brand-on-accent |

---

## Current Status

**Reviewed: 2026-11-15. Main project tracker:** this file owns current status, priorities and completion criteria. [Improvement history](ultra-progress.md) records earlier polish; the security documents below hold detailed evidence and rollout procedures.

**Overall:** Core customer, admin and POS implementation exists. The original checklist records 29/30 steps complete, but production readiness is blocked on security follow-up and hosted staging verification. Step 30 remains open; this review did not establish the current live deployment state.

**Latest committed work:** `1eab648` (2026-11-12), on local branch `security/trusted-orders`. No newer local commit was found during this review. Remote branch/deployment state was not refreshed.

### Last progress recap

- Customer browsing, product detail, cart, checkout, order history/status, profile and loyalty screens are implemented, with admin dashboard/menu/orders and POS. Earlier logs record theme/mobile QA and the Serwist migration.
- Application hardening (`f1e7b6b`) added admin/shop checks and product input validation, safe local redirects, private-data cache exclusions, and customer payment acknowledgement that leaves payment pending for staff verification.
- Remote build-loader containment (`f39ea5f`, evidence in `544b73b`) retained the clean PostCSS configuration. Whether any host or deployment executed the injected revision, and whether exposed credentials were rotated, remains unverified. See [incident and account follow-up](docs/security-incident-2026-11-12.md).
- Trusted orders (`1eab648`) added the migration at `supabase/migrations/202611120001_trusted_orders.sql`: protected profile authorization fields, catalog-derived pricing, atomic order/item creation, bounded input checks, idempotency and removal of direct browser order creation bypasses.
- Customer checkout and POS now use the same trusted RPC. Staff payment/status transitions record verification actor/time, reject invalid transitions, and require a persisted row before UI success. POS can resume a pending payment; QRIS uses the saved database total.
- No live database migration or hosted staging acceptance run is recorded. Local implementation is complete for this slice; deployed correctness is not established.

### Validation baseline

These are **recorded results from 2026-11-12**, not checks rerun on 2026-11-15:

| Check | Last recorded result | Remaining limit |
| --- | --- | --- |
| Security tests | 14 passed: 9 PostgreSQL/PGlite + 5 application tests | Hosted Auth/Data API/Realtime/Storage and concurrent sessions still need verification |
| Production build | Passed; Next.js 15.5.29, 19 pages generated | Build skips ESLint; parent workspace lockfile warning remains |
| Project TypeScript and changed-file ESLint | Passed | Does not establish full repository lint health |
| Full lint | 43 errors and 3 warnings | Existing auth/splash/UI debt remains |
| Production dependency audit | 11 findings: 0 critical, 8 high, 3 moderate | Historical count; rerun and assess current exposure before release |
| Anonymous HTTP smoke checks | Login 200; protected routes redirect; security headers present | Authenticated role, payment and tenant flows untested on staging |

**Existing uncommitted work at review start:** root `.claude/settings.local.json`, `components/customer/ProductCard.tsx` (removed Image import), and `tsconfig.json` (including JSX setting). The duplicate-order follow-up restored the missing Image import because it broke TypeScript; the settings and tsconfig changes remain preserved. Review outstanding changes before preparing the release.

## Next Execution Plan

Work through the following gates in order. Local lint/dependency cleanup can proceed while staging/account information is being collected. Record evidence and date before checking an item off.

### 1. Establish a trusted environment and identify staging

- [ ] Investigate whether machines, CI or deployments ran the injected revision; preserve build/access evidence and complete any required account/credential remediation from the incident document.
- [ ] Identify the isolated Supabase staging project, matching application preview URL, intended production project and release owner. Do not assume the currently configured project is staging.
- [ ] Prepare disposable customer A/B, shop A staff/admin and shop B staff/admin accounts. Keep credentials out of progress logs.
- [ ] Review the three existing uncommitted files and decide which changes belong in the release.

**Done when:** environment identities and incident disposition are recorded, a trusted worker is available, and staging accounts can be used safely. Account/hosting access is needed to establish this evidence.

### 2. Inspect the effective staging database and apply the migration

- [ ] Save a staging backup and run the read-only `supabase/security-inspection.sql` inventory.
- [ ] Compare effective policies, column/table grants, callable definer functions, triggers and storage rules with the checked-in schema. Review custom policies on users/products/orders/order_items because the migration replaces them.
- [ ] Inspect legacy payment/status inconsistencies and loyalty triggers; document how historical records will be handled without inventing payment evidence.
- [ ] Apply `202611120001_trusted_orders.sql` transactionally on staging and verify PostgREST exposes the new RPC. Avoid replaying legacy setup scripts that restore permissive policies.

**Done when:** the reviewed migration is present in staging, grants/policies match the intended design, the RPC is callable by the intended identities, and backup/recovery evidence is saved. Follow [trusted orders rollout](docs/trusted-orders-rollout.md) for the procedure.

### 3. Prove authorization and order integrity through the hosted API

- [ ] Exercise anonymous, customer, staff and admin sessions directly through the Data API, including expired sessions and cross-shop/customer access attempts.
- [ ] Verify role/org escalation, direct order/item writes, forged payment/status fields and unauthorized product writes fail.
- [ ] Verify catalog pricing and quantity/product/shop validation, and force a line-item failure to establish transaction rollback.
- [ ] Send concurrent identical requests with one idempotency key: expect one order and one set of lines. Reuse the key with a different payload: expect rejection.
- [ ] Verify authorized payment confirmation stores actor/time; repeated confirmation preserves evidence, invalid transitions fail, and loyalty is not credited twice.

**Done when:** every relevant case in the [security acceptance matrix](docs/security-progress-review-2026-11-12.md#acceptance-matrix) has a dated staging result and any failure has been fixed and retested.

### 4. Verify complete customer and staff browser flows

- [ ] Deploy the matching application branch to staging after the database migration.
- [ ] Complete customer QRIS and cash flows, including acknowledgement that stays pending until staff verification, saved totals after catalog price changes, and order history/status updates.
- [ ] Complete POS order creation, payment-sheet close/resume, admin confirmation and order progression; verify errors and zero-row mutations do not show success.
- [ ] Exercise network failures/retries and page reloads. Saved attempt keys and pending-order recovery are now implemented locally; verify them in real browsers, including concurrent tabs, storage failure, and lost responses with changed carts. Separate browser profiles/devices still have separate attempts.
- [ ] Check Realtime updates, logout/account switching, legacy service-worker upgrades and offline navigation for private-data exposure.
- [ ] Recheck mobile layout and the four supported theme states on affected flows.

**Done when:** real customer/admin/POS flows pass with persisted database evidence, including payment audit and reward behavior.

### 5. Close remaining release-quality gaps

- [ ] Rerun the dependency audit, patch compatible affected packages and record the disposition of each remaining finding; do not treat the old count as current.
- [ ] Resolve tenant storage-path permissions and verify access with cross-shop identities.
- [ ] Establish and test rate limits, security-event logging/alerts, hosting access controls and backup recovery. Record any remaining CSP hardening decision.
- [ ] Resolve full-project lint failures and warnings; resolve the workspace tracing-root warning and make source lint an explicit release check.
- [ ] Run `npm run test:security`, full lint, production build and TypeScript sequentially where generated build types are involved; include the dedicated service-worker type check. Record exact commands/results and the tested commit.

**Done when:** release checks pass, security findings have documented dispositions, and there are no unresolved release blockers.

### 6. Release database and application together

- [ ] Review the final diff and staging evidence before merging `security/trusted-orders` into main.
- [ ] Take the production backup and apply the reviewed production database migration before deploying application code that requires the RPC.
- [ ] Verify production environment variables, deployed commit and clean build provenance; execute customer/admin/POS smoke checks and monitor errors, payment audits and order duplication.
- [ ] Record the release URL, revision, migration, validation evidence and recovery procedure; then mark Step 30 complete.

**Done when:** production smoke checks pass and the release record is complete. Recovery must preserve the security boundary: the old UI cannot safely be restored alone after direct INSERT privileges are revoked; fix forward or use a tested coordinated restore.

### After the release gates

- [ ] Reconcile schema/setup documentation with the tested migration path so future environments do not restore legacy permissions.
- [ ] Prioritize admin voucher/loyalty management if needed; these management screens are not part of the completed implementation.
- [ ] Decide whether payment automation is a separate future feature. The current MVP remains static QRIS with staff verification.

## Tracking Rules and Latest Review

- Update this file at the end of each implementation session: completed work, commit/branch, commands and outcomes, remaining blockers and the next concrete action.
- Keep implementation, local verification, staging verification and production deployment as separate claims. Link evidence rather than marking a task done based on code presence alone.
- Preserve the original phase/session history; use this current section for release decisions. Older security findings describe their review date, with later changes documented in their follow-ups.

**2026-11-15 documentation review:** reconciled local Git history, working-tree changes, build/improvement trackers and security/rollout documents. Updated this tracker and corrected stale improvement guidance. No application tests, live API checks, database migration, merge or deployment was performed.

**Next concrete action:** establish incident follow-up status and identify isolated staging, then run the read-only database inventory. In parallel with gathering that access, the next local implementation task is lint/dependency cleanup and review of the existing uncommitted changes.

### 2026-11-15 implementation follow-up: duplicate orders and payment confirmation

- [x] Persist checkout attempt keys across reloads, scoped to account/shop/customer or POS; store only payload digests and keys.
- [x] Coordinate active submissions with Web Locks and block checkout until pending-order recovery completes. Reuse the saved database order instead of showing a second order after refresh.
- [x] Add immediate POS/admin mutation locks, disable busy admin buttons, and conditionally confirm only pending unpaid orders. Already-paid retries read current status without repeating the effective payment update.
- [x] Preserve uncertain attempts and reject changed payloads; release confirmed validation rejections for correction. Restore the existing missing ProductCard Image import to unblock type checking.
- [x] Local verification: `npm.cmd run test:security` (19 passed), scoped ESLint, `npx.cmd tsc --noEmit --incremental false`, production build and `git diff --check` passed. Existing workspace-root warning remains; full lint/audit were not rerun.
- [ ] Hosted staging verification and real multi-tab browser acceptance remain pending. No migration, merge or deployment performed.

See [duplicate-submission details and limits](docs/trusted-orders-rollout.md#duplicate-submission-follow-up-2026-11-15). Static QRIS still relies on staff verification and cannot prevent repeated transfers inside an external wallet.
