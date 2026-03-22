"use client"

import { useEffect, useRef } from "react"

const SKY_GRADIENTS = [
  "radial-gradient(ellipse at 50% 120%, #0d0515 0%, #080010 40%, #020008 100%)",
  "radial-gradient(ellipse at 50% 110%, #1a0a2e 0%, #0a1525 40%, #050510 100%)",
  "radial-gradient(ellipse at 50% 100%, #3d1200 0%, #1a0a20 50%, #050510 100%)",
]

const STAR_OPACITY_MULTIPLIERS = [1.0, 0.6, 0.3]

interface Star {
  x: number
  y: number
  radius: number
  baseOpacity: number
  freq1: number
  freq2: number
  freq3: number
  phase1: number
  phase2: number
  phase3: number
  flareSpeed: number
  flarePhase: number
  colorR: number
  colorG: number
  colorB: number
}

interface MilkyWayBlob {
  x: number  // normalized 0–1
  y: number
  rx: number // x radius normalized
  ry: number // y radius normalized
  opacity: number
  r: number
  g: number
  b: number
}

export default function StarField({ bgIndex }: { bgIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const milkyWayRef = useRef<MilkyWayBlob[]>([])
  const rafRef = useRef(0)
  const rotationRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    // --- Stars ---
    const stars: Star[] = []
    for (let i = 0; i < 1400; i++) {
      const temp = Math.random()
      let colorR = 255, colorG = 255, colorB = 255
      if (temp < 0.15) {
        colorR = 255; colorG = 215 + Math.random() * 35; colorB = 170 + Math.random() * 50
      } else if (temp < 0.3) {
        colorR = 190 + Math.random() * 40; colorG = 215 + Math.random() * 35; colorB = 255
      }

      stars.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.3 + Math.random() * 1.4 + (Math.random() < 0.05 ? 1.3 : 0),
        baseOpacity: 0.35 + Math.random() * 0.65,
        freq1: 0.6 + Math.random() * 1.8,
        freq2: 2.0 + Math.random() * 5.0,
        freq3: 6.0 + Math.random() * 12.0,
        phase1: Math.random() * Math.PI * 2,
        phase2: Math.random() * Math.PI * 2,
        phase3: Math.random() * Math.PI * 2,
        flareSpeed: 0.04 + Math.random() * 0.18,
        flarePhase: Math.random() * Math.PI * 2,
        colorR, colorG, colorB,
      })
    }
    starsRef.current = stars

    // --- Milky Way blobs ---
    const blobs: MilkyWayBlob[] = []

    // Curved centerline: arc diagonally across upper-center sky
    const bandSteps = 80
    for (let i = 0; i < bandSteps; i++) {
      const t = i / bandSteps
      // Centerline: curves gently across the sky
      const cx = 0.05 + t * 0.92
      const cy = 0.62 - Math.sin(t * Math.PI) * 0.22 - t * 0.18

      // Scatter blobs around the centerline with varying width
      const scatterCount = Math.random() < 0.3 ? 3 : 2
      for (let j = 0; j < scatterCount; j++) {
        const offX = (Math.random() - 0.5) * 0.07
        const offY = (Math.random() - 0.5) * 0.09
        const bright = Math.random() < 0.25

        blobs.push({
          x: cx + offX,
          y: cy + offY,
          rx: 0.05 + Math.random() * 0.13,
          ry: 0.025 + Math.random() * 0.06,
          opacity: bright ? 0.055 + Math.random() * 0.055 : 0.018 + Math.random() * 0.028,
          r: 155 + Math.random() * 50,
          g: 165 + Math.random() * 50,
          b: 220 + Math.random() * 35,
        })
      }
    }

    // Extra density knots — brighter patches like the galactic core region
    for (let i = 0; i < 18; i++) {
      const t = 0.3 + Math.random() * 0.4
      const cx = 0.05 + t * 0.92
      const cy = 0.62 - Math.sin(t * Math.PI) * 0.22 - t * 0.18
      blobs.push({
        x: cx + (Math.random() - 0.5) * 0.06,
        y: cy + (Math.random() - 0.5) * 0.06,
        rx: 0.07 + Math.random() * 0.11,
        ry: 0.035 + Math.random() * 0.055,
        opacity: 0.07 + Math.random() * 0.06,
        r: 200 + Math.random() * 30,
        g: 190 + Math.random() * 30,
        b: 240 + Math.random() * 15,
      })
    }

    milkyWayRef.current = blobs
  }, [])

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

      rotationRef.current += delta * 0.000003

      const w = canvas.width
      const h = canvas.height
      const opacityMult = STAR_OPACITY_MULTIPLIERS[bgIndex] ?? 1.0

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((rotationRef.current * Math.PI) / 180)
      ctx.translate(-w / 2, -h / 2)

      // Milky Way — drawn before stars so stars sit on top
      for (const blob of milkyWayRef.current) {
        const bx = blob.x * w
        const by = blob.y * h
        const brx = blob.rx * w
        const bry = blob.ry * h
        const alpha = blob.opacity * opacityMult

        // Draw elliptical soft glow via scale trick
        ctx.save()
        ctx.translate(bx, by)
        ctx.scale(brx, bry)
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        grad.addColorStop(0, `rgba(${blob.r}, ${blob.g}, ${blob.b}, ${alpha})`)
        grad.addColorStop(0.4, `rgba(${blob.r}, ${blob.g}, ${blob.b}, ${alpha * 0.5})`)
        grad.addColorStop(1, `rgba(${blob.r}, ${blob.g}, ${blob.b}, 0)`)
        ctx.beginPath()
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.restore()
      }

      // Stars
      for (const star of starsRef.current) {
        const t = timestamp * 0.001

        const wave1 = Math.sin(t * star.freq1 + star.phase1)
        const wave2 = Math.sin(t * star.freq2 + star.phase2) * 0.5
        const wave3 = Math.sin(t * star.freq3 + star.phase3) * 0.25

        const combined = (wave1 + wave2 + wave3 + 1.75) / 3.5

        const flareCycle = Math.sin(t * star.flareSpeed + star.flarePhase)
        const flare = Math.pow(Math.max(0, flareCycle), 10) * 1.0

        // Deeper dim range + stronger flares
        const twinkle = Math.min(1, combined * 0.88 + 0.12 + flare)
        const alpha = star.baseOpacity * opacityMult * twinkle

        const r = star.radius + flare * 1.2

        ctx.beginPath()
        ctx.arc(star.x * w, star.y * h, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${star.colorR}, ${star.colorG}, ${star.colorB}, ${alpha})`
        ctx.fill()
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [bgIndex])

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          background: SKY_GRADIENTS[bgIndex],
          transition: "background 1200ms ease-in-out",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
    </>
  )
}
