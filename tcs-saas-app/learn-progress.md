# Learn Progress — TCS Coffee App
> Started: 2026-05-15 | Last updated: 2026-05-15
> Tracks what I have UNDERSTOOD and WRITTEN MYSELF.
> Different from [[build-progress.md]] — something can be built without being understood.

## Legend
- [ ] Not started
- [~] Learning in progress
- [x] Understood and written by me

---

## Phase 1 — Project Setup

- [x] Step 1: Scaffold Next.js project — [[CLAUDE.md#15. First Steps (in order)]] #learned
      Written: 2026-05-15
      Notes: app/ at root (no src/), App Router, TypeScript, Tailwind v4
- [x] Step 2: Verify installed versions — [[CLAUDE.md#3. Tech Stack]] #learned
      Written: 2026-05-15
      Notes: Next.js 16.2.6, React 19.2.4, Tailwind v4 via @tailwindcss/postcss (no tailwindcss CLI binary in v4 — expected)
- [x] Step 3: Install core packages — [[CLAUDE.md#3. Tech Stack]] #learned
      Written: 2026-05-15
      Notes: All 5 packages confirmed. Deprecation warnings from transitive deps — ignore. Don't run npm audit fix --force.

---

## Phase 2 — Figma First

- [ ] Step 4: Extract design tokens from Figma — [[CLAUDE.md#7. Design System]]
- [ ] Step 5: Set up globals.css with Tailwind v4 tokens + FOUC prevention — [[CLAUDE.md#7. Design System]]
- [ ] Step 6: Build component inventory from Figma screens — [[CLAUDE.md#5. Project Structure]]

---

## Phase 3 — Backend

- [ ] Step 7: Create Supabase project + all tables in order + enable RLS — [[CLAUDE.md#4. Database Schema]]
- [ ] Step 8: Seed organization row for TCS Coffee — [[CLAUDE.md#10. Supabase Conventions]]
- [ ] Step 9: Set up .env.local — [[CLAUDE.md#11. Environment Variables]]
- [ ] Step 10: Configure middleware.ts — [[CLAUDE.md#6. Auth & Role System]]
- [ ] Step 11: Set up Supabase client files — [[CLAUDE.md#10. Supabase Conventions]]
- [ ] Step 12: Supabase CLI login + generate types — [[CLAUDE.md#10. Supabase Conventions]]
- [ ] Step 13: Seed real product data — [[CLAUDE.md#4. Database Schema]]

---

## Phase 4 — Components (presentational only)

- [ ] Step 14: Build /components/ui/ base components — [[CLAUDE.md#5. Project Structure]]
- [ ] Step 15: Build customer feature components — [[CLAUDE.md#5. Project Structure]]
- [ ] Step 16: Build admin feature components — [[CLAUDE.md#5. Project Structure]]
- [ ] Step 17: Build POS components — [[CLAUDE.md#5. Project Structure]]

---

## Phase 5 — Pages (wire to real data)

- [ ] Step 18: Auth pages (/auth/login, /auth/register) — [[CLAUDE.md#6. Auth & Role System]]
- [ ] Step 19: Customer layout + BottomNav — [[CLAUDE.md#5. Project Structure]]
- [ ] Step 20: Menu + product pages (Server Components) — [[CLAUDE.md#12. Coding Conventions]]
- [ ] Step 21: Cart (Zustand store) — [[CLAUDE.md#2. Architecture Decision Log]]
- [ ] Step 22: Checkout + QRIS display — [[CLAUDE.md#9. Key Business Logic]]
- [ ] Step 23: Order status page (Supabase Realtime) — [[CLAUDE.md#9. Key Business Logic]]
- [ ] Step 24: Admin layout + order queue — [[CLAUDE.md#8. MVP Feature Scope]]
- [ ] Step 25: POS view — [[CLAUDE.md#8. MVP Feature Scope]]
- [ ] Step 26: Loyalty + vouchers — [[CLAUDE.md#9. Key Business Logic]]

---

## Phase 6 — Polish & Deploy

- [ ] Step 27: PWA config + manifest + icons — [[CLAUDE.md#14. Deployment]]
- [ ] Step 28: Dark mode polish pass — [[CLAUDE.md#7. Design System]]
- [ ] Step 29: Full QA on 375px mobile viewport — [[CLAUDE.md#16. Project Context for Claude Code]]
- [ ] Step 30: Deploy to Vercel — [[CLAUDE.md#14. Deployment]]

---

## Session Log

| Session | Date       | Steps learned | Notes |
|---------|------------|---------------|-------|
| 1       | 2026-05-15 | —             | ultra-learn activated, Build Mode |
| 2       | 2026-05-15 | Steps 1–3     | Scaffolded project, verified versions, installed all core packages |

---

## Insights Log
> Lessons worth remembering — beyond just fixing errors
