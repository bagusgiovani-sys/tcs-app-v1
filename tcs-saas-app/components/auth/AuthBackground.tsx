'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  CoffeeBean, V60, Kettle, Mug, EspressoCup, MokaPot, CoffeeBag,
} from '@/components/splash/CoffeeElements'

// Extracted from TCS pop art paper.png
// Sandy golden bg, coral V60, teal french press, dark brown outlines, cream card

const FLOATERS = [
  { id: 'v60',   El: V60,         size: 108, rot: -18, top: '-2%',  left: '-6%',  depth: 1.8, bobMs: 3400, bobDelay: 0 },
  { id: 'kettle',El: Kettle,      size: 92,  rot:  14, top: '-1%',  right: '-5%', depth: 2.2, bobMs: 3900, bobDelay: 600 },
  { id: 'moka',  El: MokaPot,     size: 88,  rot:   8, bottom: '26%', left: '-5%',depth: 1.5, bobMs: 4200, bobDelay: 300 },
  { id: 'bag',   El: CoffeeBag,   size: 84,  rot: -10, bottom: '24%', right: '-4%',depth: 2.0, bobMs: 3700, bobDelay: 900 },
  { id: 'mug',   El: Mug,         size: 72,  rot:  20, top: '30%',  left:  '2%',  depth: 2.5, bobMs: 3200, bobDelay: 450 },
  { id: 'esp',   El: EspressoCup, size: 64,  rot:  -8, top: '38%',  right: '3%',  depth: 2.8, bobMs: 3600, bobDelay: 750 },
  { id: 'bean1', El: CoffeeBean,  size: 52,  rot:  38, top: '20%',  left: '18%',  depth: 3.2, bobMs: 2800, bobDelay: 200 },
  { id: 'bean2', El: CoffeeBean,  size: 44,  rot: -25, top: '22%',  right: '16%', depth: 3.0, bobMs: 3100, bobDelay: 1100 },
  { id: 'bean3', El: CoffeeBean,  size: 38,  rot:  55, bottom: '38%', left: '22%',depth: 2.6, bobMs: 2600, bobDelay: 550 },
]

export default function AuthBackground({ children }: { children: React.ReactNode }) {
  const bgRef    = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const [gyroBlocked, setGyroBlocked] = useState(false)

  useEffect(() => {
    const target  = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let gyroActive = false

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return
      target.x = Math.max(-1, Math.min(1, e.gamma / 35))
      target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 35))
      gyroActive = true
    }

    const attachGyro = () => window.addEventListener('deviceorientation', onOrientation, true)

    const iosRequestPermission = async () => {
      try {
        // @ts-expect-error iOS 13+ non-standard
        const perm = await DeviceOrientationEvent.requestPermission()
        if (perm === 'granted') { attachGyro(); setGyroBlocked(false) }
      } catch { /* silent */ }
    }

    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      // @ts-expect-error iOS 13+ check
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        setGyroBlocked(true)
        window.addEventListener('pointerdown', iosRequestPermission, { once: true })
      } else {
        attachGyro()
      }
    }

    const onMove = (e: MouseEvent) => {
      if (gyroActive) return
      target.x = e.clientX / window.innerWidth - 0.5
      target.y = e.clientY / window.innerHeight - 0.5
    }
    const onLeave = () => { if (!gyroActive) { target.x = 0; target.y = 0 } }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseleave', onLeave)

    let raf = 0
    const loop = () => {
      current.x += (target.x - current.x) * 0.055
      current.y += (target.y - current.y) * 0.055
      // Background moves subtly opposite (counter-parallax feel)
      if (bgRef.current) {
        bgRef.current.style.transform =
          `scale(1.08) rotateY(${-current.x * 4}deg) rotateX(${current.y * 3}deg)`
      }
      // Icons move more dramatically
      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `rotateY(${current.x * 18}deg) rotateX(${-current.y * 14}deg)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('deviceorientation', onOrientation, true)
    }
  }, [])

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ perspective: '1000px' }}>
      {/* Background image layer */}
      <div
        ref={bgRef}
        className="fixed inset-0 z-0 will-change-transform"
        style={{ transformOrigin: 'center center', transformStyle: 'preserve-3d' }}
      >
        <Image
          src="/tcs-pop-art.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay so form is readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />
      </div>

      {/* Floating icons layer */}
      <div
        ref={sceneRef}
        className="fixed inset-0 z-10 pointer-events-none will-change-transform"
        style={{ transformOrigin: 'center center', transformStyle: 'preserve-3d' }}
      >
        {FLOATERS.map((f) => (
          <div
            key={f.id}
            className="absolute"
            style={{
              top: f.top,
              left: (f as any).left,
              right: (f as any).right,
              bottom: (f as any).bottom,
              animation: `authBob ${f.bobMs}ms ease-in-out ${f.bobDelay}ms infinite alternate`,
            }}
          >
            <div style={{ transform: `rotate(${f.rot}deg)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.28))' }}>
              <f.El size={f.size} />
            </div>
          </div>
        ))}
      </div>

      {/* iOS gyro hint */}
      {gyroBlocked && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <p className="font-sans text-[11px] text-white/60 bg-black/30 rounded-full px-3 py-1 backdrop-blur-sm">
            tap to enable motion ✦
          </p>
        </div>
      )}

      {/* Content */}
      <div className="relative z-20 min-h-dvh flex flex-col items-center justify-end pb-10 px-5">
        {children}
      </div>

      <style>{`
        @keyframes authBob {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(-18px) rotate(3deg); }
        }
      `}</style>
    </div>
  )
}
