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
}

export default function SkyCanvas({ scrollOffsetRef }: { scrollOffsetRef: MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const milkyWayRef = useRef<MilkyWayBlob[]>([])
  const rafRef = useRef(0)
  const rotationRef = useRef(0)
  const lastTimeRef = useRef(0)

  // Initialise stars and Milky Way blobs once
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.4 + Math.random() * 1.4,
        baseOpacity: 0.3 + Math.random() * 0.6,
        twinkleSpeed: 0.15 + Math.random() * 0.55,
        twinkleOffset: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.8,
      })
    }
    starsRef.current = stars

    // 40 radial gradient blobs along a diagonal path
    const blobs: MilkyWayBlob[] = []
    for (let i = 0; i < 40; i++) {
      const t = i / 39
      blobs.push({
        x: 0.15 + t * 0.70,
        y: 0.20 + t * 0.40,
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

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const delta = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      // Accumulate imperceptible rotation
      rotationRef.current += delta * 0.000003

      const w = canvas.width
      const h = canvas.height

      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((rotationRef.current * Math.PI) / 180)
      ctx.translate(-w / 2, -h / 2)

      // ── Sky gradient ───────────────────────────────────────────
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0.00, "#000000")
      grad.addColorStop(0.35, "#040000")
      grad.addColorStop(0.65, "#0e0000")
      grad.addColorStop(0.85, "#1e0000")
      grad.addColorStop(1.00, "#150000")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // ── Milky Way ──────────────────────────────────────────────
      // Path drifts +/-2% on a 90-second sine
      const drift = Math.sin(timestamp * (Math.PI * 2 / 90000)) * 0.02
      for (const blob of milkyWayRef.current) {
        const bx = (blob.x + drift) * w
        const by = blob.y * h
        const r = 80
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r)
        g.addColorStop(0, "rgba(160,40,30,0.06)")
        g.addColorStop(1, "transparent")
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(bx, by, r, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Sun corona ─────────────────────────────────────────────
      const sunX = w * 0.5
      const sunY = h * 0.38
      const sunR = h * 0.26
      const pulse = 0.75 + 0.25 * Math.sin(timestamp * 0.00007)

      // Mid glow
      const midGlow = ctx.createRadialGradient(sunX, sunY, sunR * 1.05, sunX, sunY, sunR * 1.7)
      midGlow.addColorStop(0, `rgba(200,30,0,${(0.3 * pulse).toFixed(3)})`)
      midGlow.addColorStop(1, "transparent")
      ctx.fillStyle = midGlow
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 1.7, 0, Math.PI * 2)
      ctx.fill()

      // Outer halo
      const outerHalo = ctx.createRadialGradient(sunX, sunY, sunR * 1.7, sunX, sunY, sunR * 3.0)
      outerHalo.addColorStop(0, `rgba(120,15,0,${(0.15 * pulse).toFixed(3)})`)
      outerHalo.addColorStop(1, "transparent")
      ctx.fillStyle = outerHalo
      ctx.beginPath()
      ctx.arc(sunX, sunY, sunR * 3.0, 0, Math.PI * 2)
      ctx.fill()

      // ── Stars ──────────────────────────────────────────────────
      const t = timestamp * 0.001
      for (const star of starsRef.current) {
        const twinkle = (Math.sin(t * star.twinkleSpeed + star.twinkleOffset) + 1) / 2 * 0.6 + 0.4
        const alpha = star.baseOpacity * twinkle
        ctx.beginPath()
        ctx.arc(star.x * w, star.y * h, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = star.warm
          ? `rgba(255,210,190,${alpha.toFixed(3)})`
          : `rgba(255,100,80,${alpha.toFixed(3)})`
        ctx.fill()
      }

      ctx.restore()

      // ── Sky grain ──────────────────────────────────────────────
      for (let i = 0; i < 6000; i++) {
        const alpha = Math.random() * 0.03 + 0.01
        ctx.fillStyle = `rgba(255,180,160,${alpha.toFixed(3)})`
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
      }

      // ── Parallax transform (applied directly — no React re-render) ──
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
