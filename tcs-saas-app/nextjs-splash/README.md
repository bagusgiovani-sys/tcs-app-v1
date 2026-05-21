# TCS Paper-Pop Splash → Next.js / Tailwind v4 / TypeScript

Drop-in animated splash screen built from the paper-pop art design.
Sequence: **intro** (parallax scene plays) → **collapse** (coffee elements get sucked into the logo card, "book close") → **zoom** (logo charges at camera) → **done** (your app fades in).

Pure React + CSS Modules. No motion libraries needed. Respects `prefers-reduced-motion`.

---

## 1 · Files to copy

Copy the `components/splash/` folder into your project. Final structure:

```
your-app/
├── public/
│   └── tcs-logo.png                        ← drop the TCS logo here
├── components/
│   └── splash/
│       ├── SplashScreen.tsx
│       ├── CoffeeElements.tsx
│       └── splash.module.css
└── app/
    ├── layout.tsx                          ← wrap children in <ClientShell/>
    └── client-shell.tsx                    ← thin "use client" wrapper
```

The `example/` folder in this package shows the wrapper + a sample `layout.tsx`.

---

## 2 · Wire it into the App Router

`app/client-shell.tsx`

```tsx
"use client";
import SplashScreen from "@/components/splash/SplashScreen";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <SplashScreen logoSrc="/tcs-logo.png" oncePerSession>
      {children}
    </SplashScreen>
  );
}
```

`app/layout.tsx`

```tsx
import ClientShell from "./client-shell";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
```

That's it. Your app mounts under the splash and reveals when the animation finishes.

---

## 3 · Props

| prop              | default            | meaning                                                              |
|-------------------|--------------------|----------------------------------------------------------------------|
| `logoSrc`         | `"/tcs-logo.png"`  | Path to your TCS logo (place in `/public`)                           |
| `introMs`         | `2200`             | How long the pop-art scene plays before collapsing                   |
| `collapseMs`      | `1000`             | Duration of the book-close collapse                                  |
| `zoomMs`          | `900`              | Duration of the zoom-in                                              |
| `skip`            | `false`            | Skip entirely and render children immediately                        |
| `oncePerSession`  | `false`            | Persist a flag in `sessionStorage` so splash only shows once         |
| `onFinish`        | —                  | Callback when `phase === "done"`                                     |

Total runtime ≈ `introMs + collapseMs + zoomMs` (default ≈ 4.1s).

---

## 4 · Tailwind v4 notes

The splash uses CSS Modules so it works regardless of your Tailwind setup — no config changes required. If you want to theme the palette globally, override these CSS vars in your `app/globals.css` (under `:root` or any wrapper):

```css
:root {
  --tcs-bg: #FBE3C2;
  --tcs-bg2: #F7CC8F;
  --tcs-ink: #2D1810;
  --tcs-cream: #FFF6E0;
  --tcs-coral: #FF5E5E;
  --tcs-mustard: #F4B942;
  --tcs-teal: #2EC4B6;
}
```

If you'd rather use Tailwind v4 utilities for these, add them to your `@theme`:

```css
@theme {
  --color-tcs-bg: #FBE3C2;
  --color-tcs-ink: #2D1810;
  --color-tcs-cream: #FFF6E0;
  --color-tcs-coral: #FF5E5E;
  --color-tcs-mustard: #F4B942;
  --color-tcs-teal: #2EC4B6;
}
```

---

## 5 · PWA splash icon

Separately from this in-app animation, iOS/Android PWA installs use a **static** splash icon (you can't show an animated splash from the manifest). Put a `192×192` and `512×512` PNG export of the logo card in `/public` and point `manifest.json` at them:

```json
{
  "name": "TCS Coffee",
  "short_name": "TCS",
  "background_color": "#FBE3C2",
  "theme_color": "#FBE3C2",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

The animated SplashScreen runs as soon as the React app mounts — which on a PWA is right after the static splash icon hands off. End result: native splash → animated splash → app.

---

## 6 · Tuning ideas

- **Quicker on repeat visits:** keep `oncePerSession` on; first session sees full splash, later page-loads skip.
- **Skip on route changes:** the component is meant to live at the layout root so route changes don't remount it. Don't put it inside `app/page.tsx`.
- **Different palette per route:** override the `--tcs-*` CSS vars on a route segment's `body` class.
- **No mouse parallax:** delete the `useEffect` block labeled "Mouse parallax" — touch devices already skip it.

---

## 7 · Accessibility

- Wrapped in `role="dialog"` with `aria-label`.
- Honors `prefers-reduced-motion` — floats, spins, and entry animations are disabled. The phase progression still runs (so the app still reveals) but without the swirly motion.
- Children mount **immediately** under the splash, so screen-readers + form autofill + analytics see the app from t=0.
