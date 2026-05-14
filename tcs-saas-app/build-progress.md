# Build Progress — TCS Coffee App
> Started: 2026-05-15 | Last updated: 2026-05-15
> Read this at the start of EVERY Claude Code session before touching any file.

## Status Legend
- [ ] Pending
- [~] In Progress
- [x] Done

---

## Phase 1 — Project Setup

- [ ] Step 1: `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
- [ ] Step 2: Check installed versions: `npx next --version && npx tailwindcss --version`
- [ ] Step 3: Install packages: `npm install @supabase/ssr @supabase/supabase-js framer-motion zustand @ducanh2912/next-pwa`
- [ ] Step 4: Set up Supabase project. Create all tables from CLAUDE.md Section 4 IN THE ORDER LISTED. Enable RLS on every table.
- [ ] Step 5: Create organization row for TCS Coffee. Note the UUID.
- [ ] Step 6: Set up `.env.local` with all variables from CLAUDE.md Section 11.

---

## Phase 2 — Foundation

- [ ] Step 7: Configure `middleware.ts` for session refresh and route protection (see Section 6 pseudocode).
- [ ] Step 8: Set up `lib/supabase/client.ts` and `lib/supabase/server.ts` (see Section 10 code examples).
- [ ] Step 9: Run `supabase gen types` to generate `lib/supabase/types.ts`.
- [ ] Step 10: Set up `globals.css` — add `@custom-variant dark`, `@theme` tokens, and `.dark` overrides from Section 7.

---

## Phase 3 — Customer App

- [ ] Step 11: Build auth pages (`/auth/login`, `/auth/register`).
- [ ] Step 12: Build customer layout with bottom nav (`app/(customer)/layout.tsx` + `BottomNav` component).
- [ ] Step 13: Build menu and product pages (public — test data fetching first).
- [ ] Step 14: Build cart (Zustand store in `lib/stores/cart.ts`).
- [ ] Step 15: Build checkout and QRIS display.
- [ ] Step 16: Build order status page with Supabase Realtime subscription.

---

## Phase 4 — Admin & POS

- [ ] Step 17: Build admin layout and order queue (`/admin` routes).
- [ ] Step 18: Build POS view (`/pos` route).
- [ ] Step 19: Build loyalty and vouchers (customer loyalty page + admin management).

---

## Phase 5 — Polish & Deploy

- [ ] Step 20: PWA config (`next.config.ts`), manifest (`app/manifest.json`), icons.
- [ ] Step 21: Dark mode polish pass — verify every component in both light and dark.
- [ ] Step 22: Full QA on mobile viewport (375px) — test thumb reach, WhatsApp link open.
- [ ] Step 23: Deploy to Vercel. Set all env vars in Vercel dashboard.

---

## Session Log

| Session | Date       | Steps completed | Token % at close | Notes |
|---------|------------|-----------------|-----------------|-------|
| 1       | 2026-05-15 | —               | —               | Scaffold files generated |

---

## Current Status

**Last completed:** —
**Currently working on:** —
**Next action:** Step 1 — `npx create-next-app@latest`
