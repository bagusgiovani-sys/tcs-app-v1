# Build Progress — TCS Coffee App
> Started: 2026-05-15 | Last updated: 2026-05-15
> Read this at the start of EVERY Claude Code session before touching any file.

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

- [ ] Step 4: Extract design tokens — **Path A:** Figma MCP (share file link, Claude extracts via `get_design_context`) **OR Path B:** Claude Design (describe brand to Claude, Claude generates token set). See [[CLAUDE.md#15. First Steps]] for both paths.
- [ ] Step 5: Overwrite `globals.css` (replace ALL content from create-next-app): add `@import "tailwindcss"`, `@custom-variant dark`, `@theme {}` with ALL tokens from Step 4, `.dark {}` overrides. Add FOUC prevention script in root `layout.tsx` (see Section 7).
- [ ] Step 6: Build component inventory from Figma — go through every screen, list every reusable component (ProductCard, Button, Badge, BottomNav, etc.), sort by reuse frequency. Do NOT write code yet — just the list.

---

## Phase 3 — Backend

- [ ] Step 7: Set up Supabase project. Create all tables from CLAUDE.md Section 4 IN THE ORDER LISTED. Enable RLS on every table.
- [ ] Step 8: Create organization row for TCS Coffee. Note the UUID.
- [ ] Step 9: Set up `.env.local` with all variables from Section 11.
- [ ] Step 10: Configure `middleware.ts` for session refresh and route protection (see Section 6 pseudocode).
- [ ] Step 11: Set up `lib/supabase/client.ts` and `lib/supabase/server.ts` (see Section 10 code examples).
- [ ] Step 12: Log in to Supabase CLI (`npx supabase login`), then generate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts`
- [ ] Step 13: Seed real data — at minimum 1 organization row + 6–8 products across categories.

---

## Phase 4 — Components (presentational only, no data fetching)

- [ ] Step 14: Build `/components/ui/` — Button, Input, Badge, Card, Sheet, Skeleton, Toast. Accept props only. Zero Supabase queries.
- [ ] Step 15: Build customer feature components — ProductCard, CartItem, OrderStatusBadge, LoyaltyCard, QRISDisplay, BottomNav, CategoryTabs. Accept props only. No data fetching inside components.
- [ ] Step 16: Build admin feature components — OrderCard, OrderQueue, ProductForm, Sidebar, StatCard. Accept props only.
- [ ] Step 17: Build POS components — MenuGrid, OrderBuilder, POSQRISModal. Accept props only.

---

## Phase 5 — Pages (wire components to real data)

- [ ] Step 18: Build auth pages (`/auth/login`, `/auth/register`).
- [ ] Step 19: Build customer layout with bottom nav (`app/(customer)/layout.tsx` + `BottomNav`).
- [ ] Step 20: Build menu + product pages (public, Server Component, real Supabase data).
- [ ] Step 21: Build cart (Zustand store in `lib/stores/cart.ts`).
- [ ] Step 22: Build checkout + QRIS display.
- [ ] Step 23: Build order status page (Supabase Realtime subscription).
- [ ] Step 24: Build admin layout + order queue.
- [ ] Step 25: Build POS view.
- [ ] Step 26: Build loyalty + vouchers.

---

## Phase 6 — Polish & Deploy

- [ ] Step 27: PWA config (`next.config.ts`), manifest (`app/manifest.json`), icons.
- [ ] Step 28: Dark mode polish pass — verify every component in both light and dark modes.
- [ ] Step 29: Full QA on mobile viewport (375px) — test thumb reach, WhatsApp link open.
- [ ] Step 30: Deploy to Vercel. Set all env vars in Vercel dashboard.

---

## Session Log

| Session | Date       | Steps completed | Token % at close | Notes |
|---------|------------|-----------------|-----------------|-------|
| 1       | 2026-05-15 | —               | —               | Scaffold files generated |
| 2       | 2026-05-15 | —               | —               | CLAUDE.md updated to v1.3; build-progress regenerated for 30-step plan |
| 3       | 2026-05-15 | Steps 1–3       | —               | ultra-learn activated; project scaffolded, versions verified, packages installed |

---

## Current Status

**Last completed:** Step 3 — core packages installed
**Currently working on:** —
**Next action:** Step 4 — extract design tokens from Figma
