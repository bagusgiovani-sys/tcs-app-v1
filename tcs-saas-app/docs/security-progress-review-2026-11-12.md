# Progress and gateway security review — 2026-11-12

## Decision

Do not treat this application as production security-ready. This review found release blockers in the checked-in authorization and order/payment design. It does not establish that the live database is exploitable: deployed policies, grants, functions, and hosting controls have not been inspected. No production writes or attack probes were performed.

## Follow-up implementation (same day)

A further implementation is available on `security/trusted-orders`: see [trusted order rollout](trusted-orders-rollout.md). It addresses profile writes, policy recursion, direct order bypasses, trusted pricing/atomicity and staff payment transitions in a tested local migration, with matching customer/POS/admin code. These findings remain live release blockers until the migration and app are validated on staging and deployed together. The remote build-loader incident is documented separately in [incident evidence](security-incident-2026-11-12.md).

The findings below describe the original review. This follow-up changes the local application, not the deployed database:

- Removed the customer checkout update that attempted to mark QRIS payments paid/confirmed. The acknowledgement now opens the pending order; staff must verify payment separately. No customer notification or payment-provider callback was added.
- Product Server Actions now independently verify the authenticated admin and configured shop, validate mutation inputs, and require a returned row for update/delete/toggle success. Database policies still need to enforce the same admin-only rule for direct Data API calls.
- Middleware now requires matching shop membership for admin/POS access. This depends on trustworthy profile data; it does not resolve the profile-write vulnerability.
- Login and auth callback destinations now pass a shared local-path validator.
- Service worker precaching is restricted to same-origin immutable build assets and icons; all other GET requests use NetworkOnly. Known legacy page/API/data caches are deleted on worker activation. Offline application pages are intentionally unavailable. Real browser account-switching and worker-upgrade checks remain pending.
- ESLint excludes generated Next.js/service worker output.
- Added `tests/security.test.cjs`: redirect attack cases, fail-closed admin checks, authorization on every product action, and worker cache isolation. These are isolated code tests, not live RLS or browser integration tests.
- Added `supabase/security-inspection.sql`, a read-only policy/grant/function/trigger/storage inventory for staging. No database changes were applied.
- Updated Next.js and eslint-config-next to 15.5.29, and Serwist packages to 9.5.13. The production dependency audit dropped from 14 findings (1 critical / 10 high / 3 moderate) to 11 (0 critical / 8 high / 3 moderate). Remaining packages include Serwist build dependencies, PostCSS, Sharp, nanoid and source-map-js; these need further patching/exposure review. This is not a clean audit.

### Follow-up verification

- `npm run build`: completed successfully with Next.js 15.5.29; all 19 pages generated. It still warns about a parent lockfile influencing the tracing root. Build-time ESLint remains disabled in the existing configuration.
- `npx tsc --noEmit --incremental false`: passed after the build generated its type files. An earlier overlapping check encountered disappearing generated files and was rerun after generation completed.
- `node --test tests/security.test.cjs`: 4 tests passed after dependency updates.
- Dedicated service-worker TypeScript check: passed (the main tsconfig excludes this file).
- ESLint for all changed application files and the test harness: passed.
- Full repository ESLint: 45 pre-existing explicit-any errors and 3 unused-import warnings remain in untouched files. Generated worker errors are resolved.
- Local production HTTP smoke check: `/auth/login` returned 200; anonymous `/admin`, `/pos`, `/checkout`, and `/order/history` returned 307 to login. All five responses included `nosniff` and CSP frame-ancestor protection. These checks do not establish authenticated authorization or database isolation.
- Live database, browser account switching, payment/POS integration and deployment verification remain pending; the staging environment has not been identified.

### Remaining execution order

1. Identify an isolated staging project and run the read-only inventory. Reconcile effective deployed permissions before changing them.
2. Restrict profile insertion and role/org column writes; replace the recursive profile SELECT policy with a narrowly scoped helper using a fixed search path. Test signup and customer/staff/admin identities directly through the Data API.
3. Implement atomic order creation with catalog-derived prices, bounded quantities, shop/product validation, fixed initial statuses and idempotency. Migrate customer checkout and POS together, then revoke direct writes that bypass validation. Current checkout still submits prices from the browser.
4. Align product/storage permissions with shop ownership, restrict payment transitions to authorized staff, and verify audit/reward behavior. Confirm rate limits and hosting controls.
5. Resolve outstanding dependency/lint findings, run the original acceptance matrix against staging and verify the deployed build before release.

## Progress

- Customer browsing, cart, checkout, order history/status, profile and loyalty screens exist, alongside admin dashboard/menu/orders and POS.
- The progress log marks 29/30 steps complete; deployment remains unchecked. Recent commits include a Next.js 16-to-15 deployment fix, so the logs lag implementation.
- Serwist migration and production security headers are present. Admin voucher/loyalty management screens remain absent. Loyalty automation and deployed RPCs cannot be established from the checked-in schema alone.
- Installed Next.js version reported by the build: 15.5.19.
- Existing changes to `tsconfig.json` and root `.claude/settings.local.json` predate this review and were preserved.

## What the gateway actually is

There is no separate application API gateway or payment-provider integration in the checked-in implementation. There are two request paths:

```text
Browser -> Next.js middleware -> pages / Server Actions -> Supabase
Browser -----------------------------------------------> Supabase Data API / Auth / Realtime / Storage
```

The second path is legitimate in a Supabase architecture, but bypasses Next.js middleware. Database grants, RLS, trusted functions, and storage policies must therefore enforce authorization independently. Frontend `shop_id` filters do not establish tenant isolation.

Static QRIS with staff verification is explicitly the intended MVP flow (`CLAUDE.md:137`). A customer notification must never itself constitute proof of payment. Automated payment confirmation would require a separate provider integration with verified callbacks and replay protection.

## Release blockers

| Priority | Evidence | Finding and required action |
| --- | --- | --- |
| Critical | `supabase-schema.sql:250` | Own-profile UPDATE policy restricts rows but not columns. With table UPDATE privileges, customers can change `role` and `org_id`. Restrict profile writes to safe columns or move authorization attributes into protected storage. Verify effective live grants and triggers. |
| Critical | `supabase-rls-v2.sql:143` | Policy named "Service role can insert users" actually uses unrestricted `WITH CHECK (true)` without `TO`. Its name provides no enforcement. Remove public profile insertion; keep profile creation in a trusted signup trigger. Exploitability also depends on grants and available profile IDs. |
| Critical | `supabase-schema.sql:256`, `:265`; `app/(customer)/checkout/page.tsx:38` | Customers supply totals, unit prices, quantities, shop, status and payment status. INSERT policies only check ownership. Implement transactional order creation that calculates prices from the catalog, validates tenant/product/quantity, fixes initial status to pending, and forbids bypass through direct table writes. Add idempotency. |
| High | `app/(customer)/checkout/page.tsx:92` | Customer confirmation attempts `paid` + `confirmed`. Checked-in SQL provides no customer UPDATE policy, so this may silently affect zero rows rather than confirm payment. If a permissive live policy exists it becomes a payment-integrity flaw. Keep customer orders pending until authorized staff verify receipt; check affected rows and errors. |
| High | `supabase-rls-v2.sql:131` | Users SELECT policy queries the same RLS-protected users table, creating a recursive-policy risk that can break profile/role lookup. Replace with a safely scoped helper and test using actual API roles. |
| High | dependency audit | `npm audit --omit=dev --json` returned 14 affected packages: 1 critical, 10 high, 3 moderate. Next.js is marked critical; Serwist dependencies also appear. Patch compatible versions and review runtime exposure individually; counts include transitive/build dependencies, not 14 proven remotely exploitable flaws. Avoid blind forced major-version changes. |

## Other hardening and correctness gaps

- `lib/actions/products.ts` exposes mutations without explicit authentication/role/org checks or runtime payload validation. RLS is currently the decisive boundary. Define whether product writes are admin-only (UI) or staff-authorized (SQL), then enforce that rule consistently.
- `middleware.ts` checks role but not organization membership. Add tenant authorization at each sensitive entry point and in the database.
- `lib/actions/auth.ts:24` forwards an unvalidated `redirectTo` to `redirect()`. Restrict redirects to validated local destinations. Also validate auth callback destinations.
- `app/sw.ts` applies Serwist `defaultCache` globally. Installed defaults cache page/RSC and cross-origin GET responses without per-user partitioning. Exclude authenticated pages, auth callbacks and Supabase API data; clear legacy sensitive caches and verify account switching/offline behavior.
- Order creation and line-item inserts are separate requests. Compensating DELETE has no matching policy in the checked-in SQL and ignores failures. Use a database transaction, not client-side rollback.
- POS and admin order mutations ignore errors and can update the UI despite persistence failure. Verify exactly one authorized row changed before success.
- `supabase-rls-v2.sql` repeats an existing product-policy name, so applying it after the base schema can fail. Consolidate reproducible migrations and compare them with live state.
- SECURITY DEFINER helpers lack a fixed safe search path; storage write policies check staff role without tenant path ownership. Harden both and restrict function execution grants.
- Production CSP permits inline scripts. Strengthen with compatible nonces/hashes after addressing the authorization blockers. Security headers already exist, but headers alone do not protect business logic.
- No application rate limiting, security-event audit trail, or automated authorization test suite was found. Hosting WAF, Supabase Auth limits, MFA, backups, secret rotation and alerting remain unverified.

## Recommended execution order

1. Inspect/export effective staging database policies, grants, functions, triggers and storage settings; reconcile migrations. Confirm deployment URL/environment separately.
2. Patch dependencies and lock down profile role/org mutations and profile insertion. Add negative authorization tests before changes reach production.
3. Implement a trusted transactional order-creation function or server endpoint; revoke direct writes that could bypass its rules. Keep customer payment status pending and restrict verification to authorized shop staff.
4. Add action-level authorization/input validation, safe redirects, private-data cache exclusions, rate limits and security logging. Resolve policy recursion and tenant storage isolation.
5. Run the matrix below against staging with disposable accounts, then verify the deployed production configuration. Deploy only after blockers are resolved and checks pass.

## Acceptance matrix

Use anonymous, customer A, customer B, shop A staff/admin and shop B staff/admin identities. Test the Data API directly as well as UI routes/Server Actions.

- Anonymous/customer requests cannot invoke admin/POS mutations or modify roles/org membership.
- Customer A cannot read or change customer B orders, profiles or loyalty; staff cannot cross shop boundaries.
- Forged totals, paid/completed statuses, negative/zero/oversized quantities, foreign-shop products and unavailable products are rejected or safely recomputed.
- Order and items either commit together or leave no rows; retries do not duplicate orders.
- A customer clicking "I've paid" cannot mark an order paid. Authorized staff confirmation works and records actor/time; repeated confirmation does not duplicate downstream rewards.
- Expired/tampered sessions fail closed; direct endpoint calls remain protected without middleware.
- Logout/account switching and offline navigation expose no previous user's cached data.
- Invalid external redirect destinations are rejected; storage access and rate limits are tested.
- Production build, source lint, type checking, dependency review and real staging checkout/admin/POS flows pass.

## Verification evidence

- `npx tsc --noEmit --incremental false`: passed.
- `npm audit --omit=dev --json`: completed with the findings above (exit 1).
- `npm run lint`: failed while reading generated `public/sw.js` during the concurrent build; the lint configuration does not exclude generated output.
- Scoped `npx.cmd eslint app components lib middleware.ts next.config.ts`: reported 47 errors and 3 warnings. Two errors came from generated `app/sw.js`; the other 45 were explicit `any` usages in admin/auth/splash code. Source lint is not passing independently of the generated-file problem.
- `npm run build`: compilation, type validation and generation of all 19 static pages succeeded; last observed at build-trace collection. It warned about selecting `C:/Exodus/Projects` as workspace root due to a parent lockfile. No completed build is claimed until the process exits successfully. Build configuration currently skips ESLint, so a build pass alone will not establish lint success.
- No live database policy inspection, role-based integration tests or deployment verification completed in this review. No suitable connected Supabase/Vercel management tool was available.

## References

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): row policies must be combined with appropriate grants and trusted functions.
- [Supabase column privileges](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/database/postgres/column-level-security.mdx): restrict writable columns rather than assuming row ownership protects role fields.
- [Next.js authentication](https://nextjs.org/docs/app/guides/authentication): enforce authorization at sensitive data operations and Server Actions.
