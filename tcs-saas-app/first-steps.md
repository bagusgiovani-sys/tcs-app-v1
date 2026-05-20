# First Steps — TCS Coffee Build Order

## Setup
```
1. npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
2. Check versions: npx next --version && npx tailwindcss --version
3. npm install @supabase/ssr @supabase/supabase-js framer-motion zustand @ducanh2912/next-pwa
```

## FIGMA FIRST — before backend or components
```
4. Extract design tokens (choose one path):
   Path A — Figma file: extract all colors/fonts/spacing via Figma MCP get_design_context
   Path B — Claude Design: describe brand (warm, premium, Indonesian coffee) → Claude generates tokens

5. Overwrite globals.css entirely (create-next-app generated one — replace ALL content):
   @import tailwindcss + @custom-variant dark + @theme tokens + .dark overrides
   + .vibe placeholder block + FOUC script in root layout.tsx

6. Component inventory from Figma:
   List every reusable component, sort by reuse frequency. DO NOT write code yet — just list.
```

## Backend
```
7.  Supabase: create project, create all tables IN ORDER from schema.md, enable RLS
8.  Create organizations row for TCS Coffee, note the UUID
9.  Set up .env.local (all vars from CLAUDE.md Section 10)
10. Configure middleware.ts (session refresh + role-based route protection)
11. Set up lib/supabase/client.ts and lib/supabase/server.ts
12. npx supabase login → npx supabase gen types typescript --project-id ID > lib/supabase/types.ts
13. Seed: 1 organization row + 6–8 products across categories
```

## Components (no data — props only)
```
14. /components/ui/: Button, Input, Badge, Card, Sheet, Skeleton, Toast
15. /components/customer/: ProductCard, CartItem, OrderStatusBadge, LoyaltyCard, QRISDisplay, BottomNav, CategoryTabs
16. /components/admin/: OrderCard, OrderQueue, ProductForm, Sidebar, StatCard
17. /components/pos/: MenuGrid, OrderBuilder, POSQRISModal
```

## Pages (wire to real data)
```
18. Auth pages: /auth/login + /auth/register
19. Customer layout with bottom nav
20. Menu + product pages (public, Server Component, real Supabase data)
21. Cart (Zustand store)
22. Checkout + QRIS display
23. Order status (Supabase Realtime)
24. Admin layout + order queue
25. POS view
26. Loyalty + vouchers
```

## Polish + Deploy
```
27. PWA: next.config.ts, app/manifest.ts, public/icons/icon-192.png + icon-512.png
28. Dark mode polish — verify all components in all 4 theme states
29. QA on 375px mobile viewport
30. Deploy to Vercel
```
