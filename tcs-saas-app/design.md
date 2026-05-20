# Design System — TCS Coffee
> Tokens extracted from Figma: https://www.figma.com/design/YnoRI1Vvi5NYeWFu2C95qb/

## globals.css Structure
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

/* TCS MODE — warm, earthy, premium Indonesian coffee */
@theme {
  /* Colors */
  --color-brand-bg:        #FAF7F2;    /* cream page background (light mode) */
  --color-brand-surface:   #F0EBE0;    /* section / panel surface */
  --color-brand-card:      #FFFFFF;    /* elevated cards */
  --color-brand-border:    #E0CCB0;    /* dividers, input borders */
  --color-brand-muted:     #E8D5B8;    /* skeleton, disabled states */
  --color-brand-text:      #1A0F0A;    /* primary text */
  --color-brand-subtext:   #7A4A2A;    /* secondary / caption text */
  --color-brand-accent:    #CE9760;    /* Figma primary: golden brown */
  --color-brand-on-accent: #39260B;    /* text ON accent/golden backgrounds */

  /* Typography */
  --font-sans:    'Poppins', sans-serif;       /* primary — Figma uses Poppins throughout */
  --font-display: 'Inter', sans-serif;         /* secondary — prices, tabs, nav labels */
  --font-mono:    'JetBrains Mono', monospace; /* order numbers, codes only */
}

/* TCS DARK MODE — based on Figma palette */
/* Figma's default experience IS the dark mode — warm dark brown */
.dark {
  --color-brand-bg:        #3A2210;    /* deep warm dark (true dark mode bg) */
  --color-brand-surface:   #543A20;    /* Figma Home screen background color */
  --color-brand-card:      #6B4928;    /* card elevated above surface */
  --color-brand-border:    #7A5A35;
  --color-brand-muted:     #A07040;
  --color-brand-text:      #FFFFFF;    /* Figma primary text */
  --color-brand-subtext:   #E3E3E3;    /* Figma subtitle text ("Good Morning") */
  --color-brand-accent:    #CE9760;    /* unchanged — same golden */
  --color-brand-on-accent: #39260B;    /* dark text on golden */
}

/* VIBE MODE — POST-MVP, colorful Vibe Mood brand */
/* Activated by .vibe class on <html> */
.vibe {
  --color-brand-bg:        #0D0D0D;
  --color-brand-surface:   #1A1A2E;
  --color-brand-card:      #16213E;
  --color-brand-border:    #0F3460;
  --color-brand-text:      #EAEAEA;
  --color-brand-subtext:   #A8A8B3;
  --color-brand-accent:    #FF6B6B;
  --color-brand-on-accent: #FFFFFF;
  /* Full palette finalized after Claude Design session */
}
```

## 4 Theme States
| `<html>` classes | Mode |
|---|---|
| (none) | TCS Light |
| `.dark` | TCS Dark |
| `.vibe` | Vibe Light |
| `.vibe.dark` | Vibe Dark |

## FOUC Prevention (root layout.tsx)
```tsx
<script dangerouslySetInnerHTML={{ __html: `
  const theme = localStorage.getItem('tcs-theme');
  const mode = localStorage.getItem('tcs-mode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (theme === 'dark' || (!theme && prefersDark)) document.documentElement.classList.add('dark');
  if (mode === 'vibe') document.documentElement.classList.add('vibe');
`}} />
```

## Google Fonts Import (root layout.tsx)
```tsx
import { Poppins, Inter, JetBrains_Mono } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-sans',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-display',
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono',
})
// Apply on <html>: className={`${poppins.variable} ${inter.variable} ${jetbrainsMono.variable}`}
```

## Figma Color Reference
| Token | Light | Dark | Source |
|---|---|---|---|
| `brand-bg` | `#FAF7F2` | `#3A2210` | Figma Home bg = dark surface |
| `brand-surface` | `#F0EBE0` | `#543A20` | Figma Home screen bg (exact) |
| `brand-card` | `#FFFFFF` | `#6B4928` | Figma Single Product = white |
| `brand-accent` | `#CE9760` | `#CE9760` | Figma primary golden (exact) |
| `brand-on-accent` | `#39260B` | `#39260B` | Figma text on golden cards |
| `brand-text` | `#1A0F0A` | `#FFFFFF` | Figma primary text |
| `brand-subtext` | `#7A4A2A` | `#E3E3E3` | Figma "Good Morning" text |
| `brand-muted` | `#E8D5B8` | `#A07040` | Figma inactive tab text ≈ `#F5F5F5` |

## Figma Special Values (use inline where needed)
```
Frosted glass banner:  bg-[rgba(206,151,96,0.49)] backdrop-blur-[10px]
Product image shadow:  shadow-[0px_11px_14px_0px_rgba(0,0,0,0.38)]
Card subtle shadow:    shadow-[0px_0px_15px_1px_rgba(0,0,0,0.06)]
Add-to-cart button:    bg-brand-accent text-brand-on-accent rounded-[10px] h-[59px]
Product card:          bg-brand-accent rounded-[7px]  (dark mode golden tile)
```

## Component Rules
```tsx
// ✅ Token auto-handles ALL modes — no dark: prefix for color tokens
<div className="bg-brand-bg border border-brand-border rounded-2xl p-4">

// ✅ dark: only for non-token utilities (opacity, blur, etc.)
<div className="opacity-100 dark:opacity-80">

// ✅ Text on accent-colored backgrounds — use on-accent token
<button className="bg-brand-accent text-brand-on-accent">Add to cart</button>

// ❌ Wrong — redundant token override
<div className="bg-brand-bg dark:bg-brand-bg">

// ❌ Wrong — no hardcoded hex
<div style={{ backgroundColor: '#543A20' }}>

// ✅ Mobile-first
<div className="px-4 md:px-6">

// ✅ Price/label text uses font-display (Inter, from Figma)
<span className="font-display font-semibold text-lg">Rp 45.000</span>

// ✅ Body/heading uses font-sans (Poppins, from Figma — default)
<h2 className="font-sans font-semibold text-xl">Arabica</h2>
```

## Typography
- Primary: **Poppins** (Google Fonts) — body, headings, descriptions
  - Weights used: 300 (Light), 400 (Regular), 600 (SemiBold), 700 (Bold)
- Secondary: **Inter** — prices, tab labels, navigation, quantity selectors
  - Weights used: 400 (Regular), 500 (Medium), 600 (SemiBold)
- Mono: **JetBrains Mono** — order numbers and codes only
- Font sizes from Figma: 9px (caption), 11px (status), 14px (label), 16px (card header), 18px (product name), 22px (screen title/price)

## Mobile-first
- Base: 375px. Max content width: 430px centered.
- Bottom nav: fixed, 64px height, with home tab having 50px circle highlight
- Primary actions in bottom 40% of screen
- Product grid: 2 columns with 20px outer padding, 11px gap

---

## Component Inventory
> From Step 6 — all reusable components identified from Figma, sorted by reuse frequency.
> DO NOT write code yet — implement in Phase 4 (build-progress.md Steps 14–17).

### Tier 1 — Very High Reuse (used on 5+ screens)
1. **Button** — primary (golden, full-width), secondary (outlined), ghost
2. **ProductCard** — 2-col grid tile: image, name, price, heart icon; golden bg in dark mode
3. **BottomNav** — fixed bottom: Home (circle highlight), Cart, Favourites, Profile
4. **Input** — text input with label, error state, icon slot
5. **Badge** — status chip: pending/confirmed/preparing/ready/completed/cancelled
6. **CategoryTabs** — horizontal scroll: active tab bold accent, inactive muted

### Tier 2 — High Reuse (3–4 screens)
7. **TopBar** — back button + title + optional right action (heart, search, bell)
8. **Skeleton** — loading placeholder for cards, text, images
9. **CartItem** — product row: image, name, size, qty stepper, price, delete
10. **QuantitySelector** — minus / number / plus with golden accent buttons
11. **Toast** — success/error snackbar (bottom of screen)
12. **Sheet** — bottom sheet container (rounded top corners, drag handle)

### Tier 3 — Medium Reuse (2 screens)
13. **OrderStatusBadge** — colored pill per order status
14. **OrderCard** — order summary row: ID, items count, total, status, timestamp
15. **QRISDisplay** — QRIS image + "I've paid" button + instructions
16. **SizeSelector** — S/M/L cups with proportional icon sizing from Figma
17. **PromoCard** — frosted glass banner: title, description, image
18. **LoyaltyCard** — points balance, earn/redeem history
19. **StatCard** — number + label + trend (admin dashboard)

### Tier 4 — Low Reuse / Feature-Specific (1 screen)
20. **IngredientArc** — curved arc with ingredient circles (product detail)
21. **ProductForm** — image upload + fields (admin menu management)
22. **OrderQueue** — realtime order list with status columns (admin)
23. **Sidebar** — admin nav (desktop-fallback, mobile = bottom sheet)
24. **MenuGrid** — POS product grid (larger tiles than customer view)
25. **OrderBuilder** — POS right panel: selected items + total + QRIS
26. **POSQRISModal** — POS payment modal with QRIS + confirm button
27. **VoucherCard** — voucher code, discount value, expiry, active/inactive toggle
