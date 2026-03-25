"use client"

import { useEffect, useRef, MutableRefObject } from "react"

interface Star {
  x: number
  y: number
  radius: number
  baseOpacity: number
  twinkleSpeed: number
  twinkleOffset: number
  warm: boolean
}

interface MilkyWayBlob {
  x: number
  y: number
  size: number
  opacity: number
}

interface CoronaBlob {
  angle: number
  dist: number     // distance from sun center as multiplier of sunR
  size: number     // blob radius as multiplier of sunR
  opacity: number
  speed: number    // slow drift speed
  phase: number
}

// Pre-compute grain alpha palette
const GRAIN_PALETTE: string[] = []
for (let i = 0; i < 20; i++) {
  const alpha = (0.01 + (i / 19) * 0.03).toFixed(3)
  GRAIN_PALETTE.push(`rgba(255,180,160,${alpha})`)
}

export default function SkyCanvas({ scrollOffsetRef }: { scrollOffsetRef: MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const milkyWayRef = useRef<MilkyWayBlob[]>([])
  const coronaBlobsRef = useRef<CoronaBlob[]>([])
  const rafRef = useRef(0)
  const rotationRef = useRef(0)
  const lastTimeRef = useRef(0)

  // Initialise stars and Milky Way blobs once
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < 1200; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.3 + Math.random() * 1.4,
        baseOpacity: 0.4 + Math.random() * 0.6,
        twinkleSpeed: 0.3 + Math.random() * 1.2,
        twinkleOffset: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.8,
      })
    }
    starsRef.current = stars

    // 40 radial gradient blobs along a diagonal path — varied sizes and opacities
    const blobs: MilkyWayBlob[] = []
    for (let i = 0; i < 40; i++) {
      const t = i / 39
      blobs.push({
        x: 0.15 + t * 0.70,
        y: 0.20 + t * 0.40,
        size: 60 + Math.random() * 50,
        opacity: 0.03 + Math.random() * 0.05,
      })
    }
    milkyWayRef.current = blobs

    // Corona blobs — irregular fuzzy splotches around the sun's edge
    const cBlobs: CoronaBlob[] = []
    for (let i = 0; i < 80; i++) {
      cBlobs.push({
        angle: Math.random() * Math.PI * 2,
        dist: 0.95 + Math.random() * 0.15,
        size: 0.04 + Math.random() * 0.08,
        opacity: 0.08 + Math.random() * 0.18,
        speed: 0.000005 + Math.random() * 0.000015,
        phase: Math.random() * Math.PI * 2,
      })
    }
    coronaBlobsRef.current = cBlobs
  }, [])

  // RAF draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + "px"
      canvas.style.height = h + "px"
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      // Accumulate imperceptible rotation
      rotationRef.current += delta * 0.000003

      const cssW = canvas.width / dpr
      const cssH = canvas.height / dpr

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      ctx.save()
      ctx.translate(cssW / 2, cssH / 2)
      ctx.rotate((rotationRef.current * Math.PI) / 180)
      ctx.translate(-cssW / 2, -cssH / 2)

      // ── Sky gradient ───────────────────────────────────────────
      const grad = ctx.createLinearGradient(0, 0, 0, cssH)
      grad.addColorStop(0.00, "#000000")
      grad.addColorStop(0.35, "#040000")
      grad.addColorStop(0.65, "#0e0000")
      grad.addColorStop(0.85, "#1e0000")
      grad.addColorStop(1.00, "#150000")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, cssW, cssH)

      // ── Milky Way ──────────────────────────────────────────────
      const drift = Math.sin(timestamp * (Math.PI * 2 / 90000)) * 0.02
      for (const blob of milkyWayRef.current) {
        const bx = (blob.x + drift) * cssW
        const by = blob.y * cssH
        const r = blob.size
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r)
        g.addColorStop(0, `rgba(160,40,30,${blob.opacity.toFixed(3)})`)
        g.addColorStop(1, "transparent")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Sun corona — rough, fuzzy, dark red, photographic ──────────
      const sunX = cssW * 0.5
      const sunY = cssH * 0.38
      const sunR = cssH * 0.26
      const pulse = 0.75 + 0.25 * Math.sin(timestamp * 0.00007)

      // Subtle wide halo — very faint
      const outerHalo = ctx.createRadialGradient(sunX, sunY, sunR * 1.2, sunX, sunY, sunR * 2.5)
      outerHalo.addColorStop(0, `rgba(100,8,0,${(0.08 * pulse).toFixed(3)})`)
      outerHalo.addColorStop(0.5, `rgba(60,4,0,${(0.03 * pulse).toFixed(3)})`)
      outerHalo.addColorStop(1, "transparent")
      ctx.fillStyle = outerHalo
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Irregular corona — 80 fuzzy blobs scattered around the edge
      for (const blob of coronaBlobsRef.current) {
        const drift = Math.sin(timestamp * blob.speed + blob.phase) * 0.02
        const bAngle = blob.angle + drift
        const bx = sunX + Math.cos(bAngle) * sunR * blob.dist
        const by = sunY + Math.sin(bAngle) * sunR * blob.dist
        const bRadius = sunR * blob.size
        const bPulse = 0.7 + 0.3 * Math.sin(timestamp * blob.speed * 3 + blob.phase)
        const alpha = blob.opacity * pulse * bPulse

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, bRadius)
        g.addColorStop(0, `rgba(180,15,0,${alpha.toFixed(3)})`)
        g.addColorStop(0.4, `rgba(130,8,0,${(alpha * 0.6).toFixed(3)})`)
        g.addColorStop(1, "transparent")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(bx, by, bRadius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Soft diffuse edge — very spread, barely there, no obvious ring
      const diffuseEdge = ctx.createRadialGradient(sunX, sunY, sunR * 0.96, sunX, sunY, sunR * 1.15)
      diffuseEdge.addColorStop(0, "transparent")
      diffuseEdge.addColorStop(0.3, `rgba(100,5,0,${(0.06 * pulse).toFixed(3)})`)
      diffuseEdge.addColorStop(0.5, `rgba(80,4,0,${(0.1 * pulse).toFixed(3)})`)
      diffuseEdge.addColorStop(0.7, `rgba(60,3,0,${(0.06 * pulse).toFixed(3)})`)
      diffuseEdge.addColorStop(1, "transparent")
      ctx.fillStyle = diffuseEdge
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 1.15, 0, Math.PI * 2)
      ctx.fill()

      // Tiny bright red limb line — very thin, glowing
      const limbLine = ctx.createRadialGradient(sunX, sunY, sunR * 0.997, sunX, sunY, sunR * 1.02)
      limbLine.addColorStop(0, "transparent")
      limbLine.addColorStop(0.25, `rgba(255,30,5,${(0.12 * pulse).toFixed(3)})`)
      limbLine.addColorStop(0.45, `rgba(255,20,0,${(0.35 * pulse).toFixed(3)})`)
      limbLine.addColorStop(0.6, `rgba(200,10,0,${(0.2 * pulse).toFixed(3)})`)
      limbLine.addColorStop(0.8, `rgba(120,5,0,${(0.08 * pulse).toFixed(3)})`)
      limbLine.addColorStop(1, "transparent")
      ctx.fillStyle = limbLine
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 1.02, 0, Math.PI * 2)
      ctx.fill()

      // ── Stars ──────────────────────────────────────────────────
      const t = timestamp * 0.001
      for (const star of starsRef.current) {
        const twinkle = (Math.sin(t * star.twinkleSpeed + star.twinkleOffset) + 1) / 2 * 0.85 + 0.15
        const alpha = star.baseOpacity * twinkle
        ctx.beginPath()
        ctx.arc(star.x * cssW, star.y * cssH, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = star.warm
          ? `rgba(255,210,190,${alpha.toFixed(3)})`
          : `rgba(255,100,80,${alpha.toFixed(3)})`
        ctx.fill()
      }

      ctx.restore()

      // Grain is now handled by GrainOverlay component

      // ── Parallax transform ──
      canvas.style.transform = `translateY(${scrollOffsetRef.current * 0.015}px)`

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
    />
  )
}
