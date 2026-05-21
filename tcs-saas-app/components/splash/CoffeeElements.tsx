// components/splash/CoffeeElements.tsx
// Paper-cut SVG components for the TCS splash. Each is built as layered
// shapes (shadow + body + highlight) so it reads as cut cardstock.
"use client";

import * as React from "react";

type BeanProps = {
  size?: number;
  rotate?: number;
  ink?: string;
  body?: string;
  hl?: string;
};

export const CoffeeBean: React.FC<BeanProps> = ({
  size = 80,
  rotate = 0,
  ink = "#2D1810",
  body = "#5A2E1C",
  hl = "#8B4A2C",
}) => (
  <svg
    viewBox="-50 -50 100 100"
    width={size}
    height={size}
    style={{ transform: `rotate(${rotate}deg)`, overflow: "visible" }}
  >
    <ellipse cx="2" cy="3" rx="36" ry="44" fill={ink} opacity="0.9" />
    <ellipse cx="0" cy="0" rx="34" ry="42" fill={body} stroke={ink} strokeWidth="3" />
    <path d="M -22 -28 Q -32 -8 -22 22" fill="none" stroke={hl} strokeWidth="4" strokeLinecap="round" opacity="0.9" />
    <path d="M 0 -38 Q -8 -18 6 0 Q 18 16 0 38" fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
    <path d="M 0 -38 Q -8 -18 6 0 Q 18 16 0 38" fill="none" stroke={hl} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
  </svg>
);

type V60Props = { size?: number; ink?: string; cone?: string; filter?: string; drip?: string };
export const V60: React.FC<V60Props> = ({
  size = 220,
  ink = "#2D1810",
  cone = "#FF5E5E",
  filter = "#FFF6E0",
  drip = "#2D1810",
}) => (
  <svg viewBox="-110 -110 220 220" width={size} height={size} style={{ overflow: "visible" }}>
    <path d="M -70 -55 L 70 -55 L 56 -38 L -56 -38 Z" fill={filter} stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M -56 -38 L -8 60 L 8 60 L 56 -38 Z" fill={filter} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
    <path d="M -82 -52 L 82 -52 L 4 78 L -4 78 Z" fill={ink} opacity="0.9" transform="translate(2,4)" />
    <path d="M -82 -52 L 82 -52 L 4 78 L -4 78 Z" fill={cone} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    {[-60, -30, 0, 30, 60].map((x, i) => (
      <line key={i} x1={x} y1="-52" x2={x * 0.05} y2="76" stroke={ink} strokeWidth="2.5" opacity="0.55" />
    ))}
    <path d="M -68 -20 L 68 -20" stroke={ink} strokeWidth="2.5" opacity="0.5" />
    <path d="M -45 10 L 45 10" stroke={ink} strokeWidth="2.5" opacity="0.5" />
    <path d="M -76 -48 L -64 -48 L -2 70 L -6 72 Z" fill="#FFF" opacity="0.18" />
    <path d="M 78 -40 Q 102 -20 92 12 Q 84 26 70 18" fill="none" stroke={ink} strokeWidth="6" strokeLinecap="round" />
    <path d="M 78 -40 Q 102 -20 92 12 Q 84 26 70 18" fill="none" stroke={cone} strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="0" cy="92" rx="5" ry="9" fill={drip} stroke={ink} strokeWidth="2" />
  </svg>
);

type KettleProps = { size?: number; ink?: string; body?: string; hl?: string; spoutTip?: string };
export const Kettle: React.FC<KettleProps> = ({
  size = 240,
  ink = "#2D1810",
  body = "#2EC4B6",
  hl = "#7FE5DB",
  spoutTip = "#FFF6E0",
}) => (
  <svg viewBox="-130 -120 260 240" width={size} height={size} style={{ overflow: "visible" }}>
    <ellipse cx="0" cy="90" rx="92" ry="10" fill="#1a0d05" opacity="0.25" />
    <path d="M -78 -30 Q -90 30 -70 70 L 70 70 Q 90 30 78 -30 Z" fill={ink} opacity="0.9" transform="translate(3,4)" />
    <path d="M -78 -30 Q -90 30 -70 70 L 70 70 Q 90 30 78 -30 Z" fill={body} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    <rect x="-50" y="-42" width="100" height="14" rx="3" fill={body} stroke={ink} strokeWidth="4" />
    <circle cx="0" cy="-52" r="9" fill={body} stroke={ink} strokeWidth="3.5" />
    <circle cx="0" cy="-52" r="3" fill={ink} />
    <path d="M -60 -20 C -100 -40 -118 -80 -82 -100 L -62 -88 C -88 -76 -78 -52 -52 -36 Z" fill={body} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    <ellipse cx="-72" cy="-94" rx="11" ry="6" fill={spoutTip} stroke={ink} strokeWidth="3" transform="rotate(-20 -72 -94)" />
    <path d="M 76 -10 Q 122 0 118 50 Q 116 70 90 64" fill="none" stroke={ink} strokeWidth="14" strokeLinecap="round" />
    <path d="M 76 -10 Q 122 0 118 50 Q 116 70 90 64" fill="none" stroke={body} strokeWidth="7" strokeLinecap="round" />
    <path d="M -64 -10 Q -76 30 -56 64" stroke={hl} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.85" />
  </svg>
);

type MugProps = { size?: number; ink?: string; body?: string; liquid?: string; accent?: string };
export const Mug: React.FC<MugProps> = ({
  size = 200,
  ink = "#2D1810",
  body = "#FFF6E0",
  liquid = "#3A1F12",
  accent = "#FF5E5E",
}) => (
  <svg viewBox="-100 -100 200 200" width={size} height={size} style={{ overflow: "visible" }}>
    <ellipse cx="4" cy="78" rx="70" ry="9" fill="#1a0d05" opacity="0.25" />
    <path d="M -64 -50 L 64 -50 L 56 70 Q 0 84 -56 70 Z" fill={ink} opacity="0.9" transform="translate(3,4)" />
    <path d="M -64 -50 L 64 -50 L 56 70 Q 0 84 -56 70 Z" fill={body} stroke={ink} strokeWidth="4.5" strokeLinejoin="round" />
    <ellipse cx="0" cy="-50" rx="64" ry="14" fill={body} stroke={ink} strokeWidth="4.5" />
    <ellipse cx="0" cy="-50" rx="54" ry="10" fill={liquid} stroke={ink} strokeWidth="3" />
    <ellipse cx="-18" cy="-54" rx="14" ry="3" fill="#6B3A20" opacity="0.8" />
    <rect x="-60" y="0" width="120" height="14" fill={accent} stroke={ink} strokeWidth="3" />
    <path d="M 60 -30 Q 110 -20 108 20 Q 104 50 56 44" fill="none" stroke={ink} strokeWidth="14" strokeLinecap="round" />
    <path d="M 60 -30 Q 102 -20 100 18 Q 96 44 56 38" fill="none" stroke={body} strokeWidth="6" strokeLinecap="round" />
  </svg>
);

type EspressoProps = { size?: number; ink?: string; body?: string; liquid?: string; accent?: string };
export const EspressoCup: React.FC<EspressoProps> = ({
  size = 170,
  ink = "#2D1810",
  body = "#FFF6E0",
  liquid = "#2D1810",
  accent = "#F4B942",
}) => (
  <svg viewBox="-100 -70 200 140" width={size} height={size} style={{ overflow: "visible" }}>
    <ellipse cx="3" cy="52" rx="92" ry="14" fill="#1a0d05" opacity="0.3" />
    <ellipse cx="0" cy="48" rx="90" ry="12" fill={body} stroke={ink} strokeWidth="4" />
    <ellipse cx="0" cy="44" rx="78" ry="8" fill={body} stroke={ink} strokeWidth="3" />
    <ellipse cx="0" cy="42" rx="36" ry="4" fill={accent} opacity="0.7" />
    <path d="M -44 -20 L 44 -20 L 36 36 Q 0 44 -36 36 Z" fill={ink} opacity="0.85" transform="translate(2,3)" />
    <path d="M -44 -20 L 44 -20 L 36 36 Q 0 44 -36 36 Z" fill={body} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    <ellipse cx="0" cy="-20" rx="44" ry="10" fill={body} stroke={ink} strokeWidth="4" />
    <ellipse cx="0" cy="-20" rx="36" ry="7" fill={liquid} stroke={ink} strokeWidth="2.5" />
    <ellipse cx="-10" cy="-22" rx="10" ry="2" fill="#8B4A2C" opacity="0.7" />
    <path d="M 42 -8 Q 64 -4 62 14 Q 60 28 36 26" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round" />
    <path d="M 42 -8 Q 58 -4 56 12 Q 54 24 36 22" fill="none" stroke={body} strokeWidth="4" strokeLinecap="round" />
  </svg>
);

type MokaProps = { size?: number; ink?: string; body?: string; top?: string; accent?: string };
export const MokaPot: React.FC<MokaProps> = ({
  size = 200,
  ink = "#2D1810",
  body = "#C8956D",
  top = "#8B4A2C",
  accent = "#FF5E5E",
}) => (
  <svg viewBox="-90 -110 180 220" width={size} height={size} style={{ overflow: "visible" }}>
    <ellipse cx="4" cy="98" rx="64" ry="8" fill="#1a0d05" opacity="0.28" />
    <path d="M -58 18 L 58 18 L 50 92 L -50 92 Z" fill={ink} opacity="0.9" transform="translate(3,3)" />
    <path d="M -58 18 L 58 18 L 50 92 L -50 92 Z" fill={body} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    <line x1="-30" y1="18" x2="-26" y2="92" stroke={ink} strokeWidth="2.5" opacity="0.5" />
    <line x1="30" y1="18" x2="26" y2="92" stroke={ink} strokeWidth="2.5" opacity="0.5" />
    <line x1="0" y1="18" x2="0" y2="92" stroke="#FFF" strokeWidth="3" opacity="0.25" />
    <rect x="-60" y="8" width="120" height="14" fill={top} stroke={ink} strokeWidth="3.5" />
    <path d="M -50 -70 L 50 -70 L 56 8 L -56 8 Z" fill={ink} opacity="0.9" transform="translate(3,3)" />
    <path d="M -50 -70 L 50 -70 L 56 8 L -56 8 Z" fill={top} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    <path d="M -50 -50 L -72 -58 L -68 -42 L -50 -36 Z" fill={top} stroke={ink} strokeWidth="3.5" strokeLinejoin="round" />
    <rect x="-30" y="-86" width="60" height="20" rx="3" fill={top} stroke={ink} strokeWidth="3.5" />
    <circle cx="0" cy="-94" r="9" fill={accent} stroke={ink} strokeWidth="3" />
    <path d="M 52 -50 Q 86 -40 84 0 Q 80 22 56 18" fill="none" stroke={ink} strokeWidth="14" strokeLinecap="round" />
    <path d="M 52 -50 Q 80 -40 78 0 Q 74 18 56 14" fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" />
    <line x1="-36" y1="-66" x2="-30" y2="4" stroke="#FFF" strokeWidth="3" opacity="0.3" />
  </svg>
);

type BagProps = { size?: number; ink?: string; body?: string; label?: string; accent?: string };
export const CoffeeBag: React.FC<BagProps> = ({
  size = 170,
  ink = "#2D1810",
  body = "#F4B942",
  label = "#FFF6E0",
  accent = "#FF5E5E",
}) => (
  <svg viewBox="-80 -110 160 220" width={size} height={size} style={{ overflow: "visible" }}>
    <path d="M -56 -78 L 56 -78 L 64 98 L -64 98 Z" fill={ink} opacity="0.9" transform="translate(4,4)" />
    <path d="M -56 -78 L 56 -78 L 64 98 L -64 98 Z" fill={body} stroke={ink} strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M -56 -78 L 0 -94 L 56 -78 L 40 -64 L -40 -64 Z" fill={ink} opacity="0.85" />
    <path d="M -56 -78 L 0 -94 L 56 -78" fill="none" stroke={ink} strokeWidth="4" strokeLinejoin="round" />
    <rect x="-22" y="-92" width="44" height="6" fill="#888" stroke={ink} strokeWidth="2.5" />
    <rect x="-44" y="-30" width="88" height="80" fill={label} stroke={ink} strokeWidth="4" />
    <ellipse cx="0" cy="-2" rx="20" ry="26" fill="#5A2E1C" stroke={ink} strokeWidth="3" />
    <path d="M 0 -24 Q -6 -8 4 4 Q 14 14 0 26" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
    <rect x="-44" y="34" width="88" height="10" fill={accent} stroke={ink} strokeWidth="3" />
    <path d="M -52 -70 L -60 90" stroke="#FFF" strokeWidth="3" opacity="0.3" />
  </svg>
);

type RaysProps = { size?: number; color?: string; ink?: string; count?: number };
export const BurstRays: React.FC<RaysProps> = ({
  size = 1000,
  color = "#F4B942",
  ink = "#2D1810",
  count = 18,
}) => {
  const rays = Array.from({ length: count })
    .map((_, i) => {
      const a = (i / count) * Math.PI * 2;
      const len = 480 + ((i * 73) % 80);
      const w = 38 + ((i * 41) % 24);
      const x1 = Math.cos(a) * 60;
      const y1 = Math.sin(a) * 60;
      const x2 = Math.cos(a) * len;
      const y2 = Math.sin(a) * len;
      const px = -Math.sin(a) * w * 0.5;
      const py = Math.cos(a) * w * 0.5;
      return `M ${x1 + px} ${y1 + py} L ${x2} ${y2} L ${x1 - px} ${y1 - py} Z`;
    })
    .join(" ");
  return (
    <svg viewBox="-500 -500 1000 1000" width={size} height={size} style={{ overflow: "visible" }}>
      <path d={rays} fill={color} stroke={ink} strokeWidth="3" strokeLinejoin="round" opacity="0.95" />
    </svg>
  );
};

type HalftoneProps = { w?: number; h?: number; color?: string; step?: number; r?: number; opacity?: number };
export const HalftoneField: React.FC<HalftoneProps> = ({
  w = 400,
  h = 400,
  color = "#2D1810",
  step = 16,
  r = 2.4,
  opacity = 0.55,
}) => {
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = (Math.floor(y / step) % 2) * (step / 2); x < w; x += step) {
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={color} />);
    }
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ opacity }}>
      {dots}
    </svg>
  );
};

type ComicProps = { text?: string; size?: number; ink?: string; fill?: string; textColor?: string; rotate?: number };
export const ComicBurst: React.FC<ComicProps> = ({
  text = "POP!",
  size = 200,
  ink = "#2D1810",
  fill = "#FFEB3B",
  textColor = "#2D1810",
  rotate = -8,
}) => {
  const pts = 14;
  const pathD = Array.from({ length: pts * 2 })
    .map((_, i) => {
      const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 95 : 70;
      return `${Math.cos(a) * r} ${Math.sin(a) * r}`;
    })
    .join(" L ");
  return (
    <svg
      viewBox="-110 -110 220 220"
      width={size}
      height={size}
      style={{ transform: `rotate(${rotate}deg)`, overflow: "visible" }}
    >
      <polygon points={pathD} fill={ink} transform="translate(4,5)" opacity="0.85" />
      <polygon points={pathD} fill={fill} stroke={ink} strokeWidth="4" strokeLinejoin="round" />
      <text
        x="0"
        y="14"
        textAnchor="middle"
        fontFamily="'Bowlby One SC', sans-serif"
        fontSize="46"
        fill={textColor}
        stroke={ink}
        strokeWidth="1.5"
        style={{ letterSpacing: "1px" }}
      >
        {text}
      </text>
    </svg>
  );
};
