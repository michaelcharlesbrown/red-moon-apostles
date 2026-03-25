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
  const rafRef = useRef(0)
  const rotationRef = useRef(0)
  const lastTimeRef = useRef(0)
  const readyRef = useRef(false)

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

      // ── Sun corona — radial glow + conic asymmetry (inspired by thykka eclipse) ──
      const sunX = cssW * 0.5
      const sunY = cssH * 0.38
      const sunR = Math.min(cssH * 0.26, cssW * 0.32)
      const pulse = 0.75 + 0.25 * Math.sin(timestamp * 0.00007)
      const coronaAngle = timestamp * 0.00004

      // 1. Radial glow — warm center fading to deep red then transparent
      const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.9, sunX, sunY, sunR * 2.2)
      glow.addColorStop(0, `rgba(200,40,0,${(0.35 * pulse).toFixed(3)})`)
      glow.addColorStop(0.3, `rgba(140,12,0,${(0.18 * pulse).toFixed(3)})`)
      glow.addColorStop(0.6, `rgba(80,5,0,${(0.06 * pulse).toFixed(3)})`)
      glow.addColorStop(1, "transparent")
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 2.2, 0, Math.PI * 2)
      ctx.fill()

      // 2. Conic gradient — asymmetric corona, masked with radial fade
      const conicSize = Math.ceil(sunR * 5)
      const offscreen = document.createElement("canvas")
      offscreen.width = conicSize
      offscreen.height = conicSize
      const oCtx = offscreen.getContext("2d")
      if (oCtx) {
        const cx = conicSize / 2
        const cy = conicSize / 2

        // Draw conic — bright spot at top (-PI/2), slowly drifting
        const conic = oCtx.createConicGradient(-Math.PI / 2 + coronaAngle, cx, cy)
        conic.addColorStop(0, `rgba(220,30,0,${(0.30 * pulse).toFixed(3)})`)
        conic.addColorStop(0.12, `rgba(180,15,0,${(0.20 * pulse).toFixed(3)})`)
        conic.addColorStop(0.35, `rgba(60,4,0,${(0.05 * pulse).toFixed(3)})`)
        conic.addColorStop(0.6, `rgba(40,2,0,${(0.03 * pulse).toFixed(3)})`)
        conic.addColorStop(0.8, `rgba(140,10,0,${(0.12 * pulse).toFixed(3)})`)
        conic.addColorStop(1, `rgba(220,30,0,${(0.30 * pulse).toFixed(3)})`)
        oCtx.fillStyle = conic
        oCtx.beginPath()
        oCtx.arc(cx, cy, cx, 0, Math.PI * 2)
        oCtx.fill()

        // Mask: radial fade — solid in the corona ring, transparent at center and edges
        oCtx.globalCompositeOperation = "destination-in"
        const mask = oCtx.createRadialGradient(cx, cy, 0, cx, cy, cx)
        mask.addColorStop(0, "transparent")
        mask.addColorStop(0.38, "transparent")
        mask.addColorStop(0.44, "rgba(255,255,255,0.6)")
        mask.addColorStop(0.55, "rgba(255,255,255,1)")
        mask.addColorStop(0.7, "rgba(255,255,255,0.5)")
        mask.addColorStop(0.85, "rgba(255,255,255,0.15)")
        mask.addColorStop(1, "transparent")
        oCtx.fillStyle = mask
        oCtx.fillRect(0, 0, conicSize, conicSize)

        // Composite onto main canvas
        ctx.drawImage(offscreen, sunX - cx, sunY - cy)
      }

      // 3. Limb line — thin bright edge
      const limb = ctx.createRadialGradient(sunX, sunY, sunR * 0.98, sunX, sunY, sunR * 1.04)
      limb.addColorStop(0, "transparent")
      limb.addColorStop(0.3, `rgba(255,40,5,${(0.15 * pulse).toFixed(3)})`)
      limb.addColorStop(0.5, `rgba(255,25,0,${(0.4 * pulse).toFixed(3)})`)
      limb.addColorStop(0.7, `rgba(180,10,0,${(0.15 * pulse).toFixed(3)})`)
      limb.addColorStop(1, "transparent")
      ctx.fillStyle = limb
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 1.04, 0, Math.PI * 2)
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

      // Signal first frame ready
      if (!readyRef.current) {
        readyRef.current = true
        window.dispatchEvent(new CustomEvent("rma-layer-ready", { detail: "sky" }))
      }

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
