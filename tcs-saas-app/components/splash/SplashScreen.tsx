// components/splash/SplashScreen.tsx
// Drop-in splash with the TCS paper-pop scene, a "book close" collapse,
// and a zoom-in handoff to the app.
//
// USAGE (App Router):
//   import SplashScreen from "@/components/splash/SplashScreen";
//   export default function ClientShell({ children }: { children: React.ReactNode }) {
//     return <SplashScreen logoSrc="/tcs-logo.png">{children}</SplashScreen>;
//   }
"use client";

import * as React from "react";
import styles from "./splash.module.css";
import {
  CoffeeBean,
  V60,
  Kettle,
  Mug,
  EspressoCup,
  MokaPot,
  CoffeeBag,
  BurstRays,
  HalftoneField,
  ComicBurst,
} from "./CoffeeElements";

export type SplashPhase = "intro" | "collapse" | "zoom" | "done";

export type SplashScreenProps = {
  /** Path to your TCS logo (place in /public, e.g. "/tcs-logo.png"). */
  logoSrc?: string;
  /** Ms to hold the intro scene before the book closes. Default 2200. */
  introMs?: number;
  /** Ms for the collapse animation. Default 1000. */
  collapseMs?: number;
  /** Ms for the zoom-in. Default 900. */
  zoomMs?: number;
  /** If true, skip everything and render children immediately (e.g. on subsequent navigations). */
  skip?: boolean;
  /** Persist a flag in sessionStorage so the splash only shows once per session. */
  oncePerSession?: boolean;
  /** Fires when the splash reaches phase=done. */
  onFinish?: () => void;
  /** Your app. Mounted only after the splash finishes. */
  children?: React.ReactNode;
};

const STORAGE_KEY = "tcs-splash-seen";

/** Stable pseudo-random for scattered bean positions */
function makeBeans(n: number, seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const out: Array<{
    x: number; y: number; rot: number; scale: number; delay: number; depth: "back" | "front";
    cx: string; cy: string; cr: string;
  }> = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 26 + rnd() * 22;
    const x = 50 + Math.cos(a) * r;
    const y = 50 + Math.sin(a) * r;
    // collapse vector: pull toward center, but exaggerated
    const dx = (50 - x) * 4;
    const dy = (50 - y) * 4;
    out.push({
      x, y,
      rot: rnd() * 360,
      scale: 0.55 + rnd() * 0.65,
      delay: rnd() * 4,
      depth: rnd() > 0.5 ? "back" : "front",
      cx: `${dx}vw`,
      cy: `${dy}vh`,
      cr: `${(rnd() - 0.5) * 720}deg`,
    });
  }
  return out;
}

export default function SplashScreen({
  logoSrc = "/tcs-logo.png",
  introMs = 2200,
  collapseMs = 1000,
  zoomMs = 900,
  skip = false,
  oncePerSession = false,
  onFinish,
  children,
}: SplashScreenProps) {
  const [mounted, setMounted] = React.useState(false);
  const [phase, setPhase] = React.useState<SplashPhase>("intro");

  // Hydration-safe mount + once-per-session check
  React.useEffect(() => {
    setMounted(true);
    if (skip) { setPhase("done"); return; }
    if (oncePerSession && typeof window !== "undefined") {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setPhase("done");
        return;
      }
    }
  }, [skip, oncePerSession]);

  // Phase timeline
  React.useEffect(() => {
    if (!mounted || phase === "done") return;
    const timers: number[] = [];
    if (phase === "intro") {
      timers.push(window.setTimeout(() => setPhase("collapse"), introMs));
    } else if (phase === "collapse") {
      timers.push(window.setTimeout(() => setPhase("zoom"), collapseMs));
    } else if (phase === "zoom") {
      timers.push(window.setTimeout(() => {
        setPhase("done");
        if (oncePerSession && typeof window !== "undefined") {
          sessionStorage.setItem(STORAGE_KEY, "1");
        }
        onFinish?.();
      }, zoomMs));
    }
    return () => { timers.forEach(clearTimeout); };
  }, [mounted, phase, introMs, collapseMs, zoomMs, oncePerSession, onFinish]);

  // Parallax — mouse on desktop, gyro on mobile (intro only)
  const sceneRef = React.useRef<HTMLDivElement | null>(null);
  const [gyroBlocked, setGyroBlocked] = React.useState(false); // iOS needs tap to unlock
  React.useEffect(() => {
    if (phase !== "intro") return;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let gyroActive = false;

    // DeviceOrientation handler — beta = front/back tilt, gamma = left/right
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      // gamma: -90..90 (left/right), beta: -180..180 (front/back, ~45° when held)
      target.x = Math.max(-1, Math.min(1, e.gamma / 35));
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35));
      gyroActive = true;
    };

    // Try to attach gyro
    const attachGyro = () => {
      window.addEventListener("deviceorientation", onOrientation, true);
    };

    const iosRequestPermission = async () => {
      try {
        // @ts-expect-error — iOS 13+ non-standard API
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === "granted") {
          attachGyro();
          setGyroBlocked(false);
        }
      } catch {
        // permission request failed silently
      }
    };

    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      // @ts-expect-error — iOS 13+ check
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS: needs user gesture — show tap hint
        setGyroBlocked(true);
        window.addEventListener("pointerdown", iosRequestPermission, { once: true });
      } else {
        // Android / desktop fallback — attach directly
        attachGyro();
      }
    }

    // Mouse fallback (only drives target when gyro hasn't fired yet)
    const onMove = (e: MouseEvent) => {
      if (gyroActive) return;
      target.x = e.clientX / window.innerWidth - 0.5;
      target.y = e.clientY / window.innerHeight - 0.5;
    };
    const onLeave = () => { if (!gyroActive) { target.x = 0; target.y = 0; } };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    // RAF smoothing loop
    let raf = 0;
    const loop = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `rotateY(${current.x * 16}deg) rotateX(${-current.y * 12}deg)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("deviceorientation", onOrientation, true);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
      setGyroBlocked(false);
    };
  }, [phase]);

  // Hide DOM entirely once finished so it doesn't intercept anything.
  const showSplash = mounted && phase !== "done";

  // Memoized scatter
  const beans = React.useMemo(() => makeBeans(11), []);

  return (
    <>
      {showSplash && (
        <div
          className={styles.root}
          data-phase={phase}
          role="dialog"
          aria-label="TCS Coffee splash"
          aria-live="polite"
        >
          {/* Background halftones (corners) */}
          <div className={styles.ht} style={{ position: "absolute", top: -20, left: -20, mixBlendMode: "multiply" }}>
            <HalftoneField w={360} h={360} color="#2D1810" opacity={0.32} />
          </div>
          <div
            className={styles.ht}
            style={{ position: "absolute", bottom: -20, right: -20, transform: "rotate(180deg)", mixBlendMode: "multiply" }}
          >
            <HalftoneField w={360} h={360} color="#2D1810" opacity={0.32} />
          </div>
          <div className={styles.ht} style={{ position: "absolute", top: "55%", left: -40, mixBlendMode: "multiply" }}>
            <HalftoneField w={220} h={220} color="#FF5E5E" opacity={0.55} step={14} r={3} />
          </div>
          <div className={styles.ht} style={{ position: "absolute", top: 40, right: 60, mixBlendMode: "multiply" }}>
            <HalftoneField w={180} h={180} color="#2EC4B6" opacity={0.6} step={14} r={3} />
          </div>

          {/* 3D scene */}
          <div className={styles.scene} ref={sceneRef}>
            {/* Burst rays */}
            <div className={`${styles.burstWrap} ${styles.rays}`} style={{ transform: "translate(-50%,-50%) translateZ(-80px)" }}>
              <div className={styles.spin}>
                <BurstRays size={typeof window !== "undefined" ? Math.min(window.innerWidth, window.innerHeight) * 1.4 : 1200} color="#F4B942" ink="#2D1810" count={18} />
              </div>
            </div>
            <div className={`${styles.burstWrap} ${styles.rays}`} style={{ opacity: 0.55, transform: "translate(-50%,-50%) translateZ(-80px)" }}>
              <div className={styles.spinRev}>
                <BurstRays size={typeof window !== "undefined" ? Math.min(window.innerWidth, window.innerHeight) * 1.0 : 900} color="#FF5E5E" ink="#2D1810" count={12} />
              </div>
            </div>

            {/* Back-layer beans */}
            {beans.filter((b) => b.depth === "back").map((b, i) => (
              <div
                key={`bb-${i}`}
                className={`${styles.abs} ${styles.paperSm} ${styles.float} ${styles.collapsible}`}
                style={{
                  left: `${b.x}%`, top: `${b.y}%`,
                  transform: "translate(-50%, -50%) translateZ(-40px)",
                  ["--rot" as any]: `${b.rot}deg`,
                  ["--collapse-x" as any]: b.cx,
                  ["--collapse-y" as any]: b.cy,
                  ["--collapse-r" as any]: b.cr,
                  animationDelay: `${b.delay}s`,
                }}
              >
                <CoffeeBean size={56 * b.scale} rotate={b.rot} ink="#2D1810" body="#3A1F12" hl="#C8956D" />
              </div>
            ))}

            {/* V60 — top-left */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                left: "16%", top: "26%",
                ["--rot" as any]: "-6deg",
                transform: "translate(-50%, -50%) rotate(-6deg) translateZ(60px)",
                ["--collapse-x" as any]: "30vw",
                ["--collapse-y" as any]: "20vh",
                ["--collapse-r" as any]: "-540deg",
                animationDelay: "0.2s",
              }}
            >
              <V60 size={Math.min(280, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.22)} />
            </div>

            {/* Kettle — top-right */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                right: "12%", top: "22%", left: "auto",
                ["--rot" as any]: "8deg",
                transform: "translate(50%, -50%) rotate(8deg) translateZ(70px)",
                ["--collapse-x" as any]: "-30vw",
                ["--collapse-y" as any]: "20vh",
                ["--collapse-r" as any]: "480deg",
                animationDelay: "1.1s",
              }}
            >
              <Kettle size={Math.min(300, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.24)} />
            </div>

            {/* Moka — bottom-left */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                left: "16%", bottom: "16%", top: "auto",
                ["--rot" as any]: "5deg",
                transform: "translate(-50%, 50%) rotate(5deg) translateZ(50px)",
                ["--collapse-x" as any]: "30vw",
                ["--collapse-y" as any]: "-20vh",
                ["--collapse-r" as any]: "-420deg",
                animationDelay: "1.8s",
              }}
            >
              <MokaPot size={Math.min(240, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.2)} />
            </div>

            {/* Bag — bottom-right */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                right: "14%", bottom: "16%", top: "auto", left: "auto",
                ["--rot" as any]: "-6deg",
                transform: "translate(50%, 50%) rotate(-6deg) translateZ(60px)",
                ["--collapse-x" as any]: "-30vw",
                ["--collapse-y" as any]: "-20vh",
                ["--collapse-r" as any]: "520deg",
                animationDelay: "2.4s",
              }}
            >
              <CoffeeBag size={Math.min(220, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.18)} />
            </div>

            {/* Espresso — bottom-center */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                left: "50%", bottom: "8%", top: "auto",
                ["--rot" as any]: "0deg",
                transform: "translate(-50%, 0) translateZ(90px)",
                ["--collapse-x" as any]: "0",
                ["--collapse-y" as any]: "-32vh",
                ["--collapse-r" as any]: "360deg",
                animationDelay: "0.6s",
              }}
            >
              <EspressoCup size={Math.min(220, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.18)} />
            </div>

            {/* Mug — top-center */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                left: "50%", top: "8%",
                ["--rot" as any]: "-3deg",
                transform: "translate(-50%, 0) rotate(-3deg) translateZ(40px)",
                ["--collapse-x" as any]: "0",
                ["--collapse-y" as any]: "32vh",
                ["--collapse-r" as any]: "-300deg",
                animationDelay: "1.4s",
              }}
            >
              <Mug size={Math.min(180, (typeof window !== "undefined" ? window.innerWidth : 1200) * 0.15)} />
            </div>

            {/* Comic labels */}
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                left: "8%", top: "62%",
                ["--rot" as any]: "-12deg",
                transform: "translate(-50%, -50%) translateZ(130px) rotate(-12deg)",
                ["--collapse-x" as any]: "32vw",
                ["--collapse-y" as any]: "-8vh",
                ["--collapse-r" as any]: "-720deg",
                animationDelay: "0.4s",
              }}
            >
              <ComicBurst text="BREW!" size={150} fill="#F4B942" />
            </div>
            <div
              className={`${styles.abs} ${styles.paper} ${styles.float} ${styles.collapsible}`}
              style={{
                right: "8%", top: "58%", left: "auto",
                ["--rot" as any]: "10deg",
                transform: "translate(50%, -50%) translateZ(120px) rotate(10deg)",
                ["--collapse-x" as any]: "-32vw",
                ["--collapse-y" as any]: "-8vh",
                ["--collapse-r" as any]: "720deg",
                animationDelay: "1.6s",
              }}
            >
              <ComicBurst text="POP!" size={130} fill="#FF5E5E" textColor="#FFF6E0" />
            </div>

            {/* Front-layer beans */}
            {beans.filter((b) => b.depth === "front").map((b, i) => (
              <div
                key={`bf-${i}`}
                className={`${styles.abs} ${styles.paperSm} ${styles.float} ${styles.collapsible}`}
                style={{
                  left: `${b.x}%`, top: `${b.y}%`,
                  transform: "translate(-50%, -50%) translateZ(110px)",
                  ["--rot" as any]: `${b.rot}deg`,
                  ["--collapse-x" as any]: b.cx,
                  ["--collapse-y" as any]: b.cy,
                  ["--collapse-r" as any]: b.cr,
                  animationDelay: `${b.delay}s`,
                }}
              >
                <CoffeeBean size={64 * b.scale} rotate={b.rot} ink="#2D1810" body="#3A1F12" hl="#C8956D" />
              </div>
            ))}

            {/* iOS gyro permission hint */}
          {gyroBlocked && (
            <div style={{
              position: "absolute", bottom: 40, left: 0, right: 0,
              display: "flex", justifyContent: "center", zIndex: 9999,
              pointerEvents: "none",
            }}>
              <span style={{
                background: "rgba(45,24,16,0.75)", color: "#FFF6E0",
                fontSize: 12, fontFamily: "var(--tcs-font, system-ui)",
                padding: "6px 16px", borderRadius: 99, letterSpacing: "0.5px",
              }}>
                tap to enable motion ✦
              </span>
            </div>
          )}

          {/* CENTRAL LOGO CARD — the "book" that closes + zooms */}
            <div className={styles.logoCard}>
              <span className={styles.tag}>EST · TCS</span>
              <span className={`${styles.tag} ${styles.tagR}`}>SINCE BEAN ONE</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoSrc} alt="TCS Coffee" />
            </div>
          </div>
        </div>
      )}

      {/* App: mount immediately so it's hydrated under the splash, but reveal on done */}
      <div
        style={{
          opacity: phase === "done" ? 1 : 0,
          transition: "opacity 400ms ease",
          pointerEvents: phase === "done" ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
