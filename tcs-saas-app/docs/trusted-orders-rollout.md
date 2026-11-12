# Trusted orders rollout

The `security/trusted-orders` branch changes customer checkout and POS to call the same `create_order` database function. Apply its database migration before deploying or merging this branch. There is no direct-table fallback: a missing RPC fails checkout with a visible error.

## What is ready locally

- `supabase/migrations/202611120001_trusted_orders.sql` replaces policies and grants on users, products, orders and order_items. It deliberately removes existing policies on those four tables; review staging customizations before applying it. Other tables and storage policies are outside this migration.
- Profile role, organization, ID and email cannot be changed by browser roles. Signup ignores role/org metadata and creates only a customer profile. Staff/admin authorization uses helpers with fixed search paths, avoiding recursive profile policies.
- Order creation takes only product IDs, bounded quantities and notes. The database snapshots catalog prices, checks availability/shop/type/payment method, fixes initial status/payment to pending, and commits the order and lines atomically. Direct order/item INSERT and DELETE grants are removed for browser roles. Staff orders use the staff account as customer, as before.
- Idempotency keys are scoped to the authenticated customer. Reusing a key with a different request fails. The UI retains keys for same-payload retries while mounted; reload/closing the tab loses this in-memory key. Parallel-connection retry behavior needs staging verification.
- Product writes require the shop admin. Staff can only update order status/payment fields in their shop. Payment verification records actor/time; repeated verification preserves that evidence. The database rejects unpaid processing, backward transitions and reopening terminal orders. Existing historical payments are not assigned fabricated confirmation evidence.
- QRIS and cash verification are explicit admin actions. POS/admin require a returned row before showing mutation success. POS retains a pending order when the payment sheet closes, preventing a second checkout and allowing payment to resume.
- QRIS displays the persisted database total, including when the local catalog/cart was stale.

## Validation

Run `npm run test:security`. The suite includes nine isolated PostgreSQL tests using PGlite plus five application tests. It starts from the checked-in base schema, models permissive Supabase grants/legacy policies, and uses actual anonymous/authenticated database roles with different simulated user claims.

Local results: 14 tests passed. Project TypeScript and ESLint for all changed files passed. The Next.js 15.5.29 production build completed successfully and generated all 19 pages. Full-project ESLint still reports 43 explicit-any errors and 3 warnings in untouched auth/splash/UI files; two order-queue typing errors were fixed in this branch. The existing build configuration skips ESLint and still warns about the parent workspace lockfile.

Covered cases include role/org escalation, signup metadata, anonymous access, recursive policies, cross-customer/shop order visibility, direct table bypasses, forged prices/statuses, invalid quantities/products, pending states, idempotency mismatch/retry, forced item-insert rollback, admin-only products, staff payment verification/audit, payment/status regressions and migration reapplication.

PGlite does not reproduce the hosted Supabase Auth, PostgREST, Storage or Realtime services. Passing these tests does not establish deployed policy correctness, concurrent session behavior, hosting protection or host integrity after the remote loader incident.

## Apply and verify on staging

1. Complete the exposure investigation in `security-incident-2026-11-12.md` and use a trusted environment. Identify staging explicitly; the configured Supabase project has not been confirmed as staging.
2. Save a staging backup and run `supabase/security-inspection.sql`. Compare grants, policies, functions, triggers and customizations. Check for unexpected callable definer functions that could bypass the new entry point.
3. Review existing orders for legacy inconsistent payment/status combinations; this migration does not rewrite historical payments. Using the database owner in staging, apply `202611120001_trusted_orders.sql` as one transaction. The schema reload notification updates PostgREST. Do not blindly replay the legacy setup scripts afterward, because they restore old permissive policies.
4. Run real Data API requests using disposable anonymous, customer A/B, staff A and admin A/B sessions. Verify the same negative cases as the local tests, especially direct table/column writes and expired sessions. Submit identical requests concurrently with one idempotency key and verify exactly one order and one set of lines exist.
5. Deploy this branch to a staging app with the matching database. Complete customer QRIS/cash checkout and staff/admin payment/status flows. Verify changed prices, request failure/retry, logout and cached-data behavior. Inspect payment audit fields, Realtime updates and any existing loyalty triggers for duplicate credit.
6. Resolve the remaining dependency, storage tenant-path, rate limiting, audit/alerting and lint findings in the original review. Merge to main and release only after staging passes and the production database has received the reviewed migration through the normal deployment process.

## Recovery

Keep this branch out of main until the database and application are ready together. If migration execution fails, its transaction rolls back. Once committed, returning only the old UI is unsafe and will fail because direct INSERT is revoked. Fix forward or restore a tested staging backup; do not restore broad role/profile/order write grants to make checkout work.

Function and grant design follows [Supabase database function guidance](https://supabase.com/docs/guides/database/functions) and [PostgreSQL privileges](https://www.postgresql.org/docs/current/ddl-priv.html).
