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
  // Multiple layered frequencies for realistic scintillation
  freq1: number
  freq2: number
  freq3: number
  phase1: number
  phase2: number
  phase3: number
  // Occasional bright flare timing
  flareSpeed: number
  flarePhase: number
  // Subtle color temperature (warm/cool white)
  colorR: number
  colorG: number
  colorB: number
}

export default function StarField({ bgIndex }: { bgIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef(0)
  const rotationRef = useRef(0)
  const lastTimeRef = useRef(0)

  // Generate stars once
  useEffect(() => {
    const stars: Star[] = []
    for (let i = 0; i < 600; i++) {
      // Vary color temperature: most white, some warm (reddish), some cool (bluish)
      const temp = Math.random()
      let colorR = 255, colorG = 255, colorB = 255
      if (temp < 0.15) {
        // Warm star
        colorR = 255; colorG = 220 + Math.random() * 30; colorB = 180 + Math.random() * 40
      } else if (temp < 0.3) {
        // Cool star
        colorR = 200 + Math.random() * 30; colorG = 220 + Math.random() * 30; colorB = 255
      }

      stars.push({
        x: Math.random(),
        y: Math.random(),
        radius: 0.3 + Math.random() * 1.2 + (Math.random() < 0.05 ? 1.0 : 0), // few bright ones
        baseOpacity: 0.3 + Math.random() * 0.7,
        // Layered frequencies — each star gets unique combination
        freq1: 0.8 + Math.random() * 1.5,   // slow primary
        freq2: 2.0 + Math.random() * 4.0,   // medium secondary
        freq3: 5.0 + Math.random() * 10.0,  // fast flutter
        phase1: Math.random() * Math.PI * 2,
        phase2: Math.random() * Math.PI * 2,
        phase3: Math.random() * Math.PI * 2,
        flareSpeed: 0.05 + Math.random() * 0.15,
        flarePhase: Math.random() * Math.PI * 2,
        colorR, colorG, colorB,
      })
    }
    starsRef.current = stars
  }, [])

  // Animation loop
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

      // Slow rotation: full rotation ~96 hours
      rotationRef.current += delta * 0.000003

      const w = canvas.width
      const h = canvas.height
      const opacityMult = STAR_OPACITY_MULTIPLIERS[bgIndex] ?? 1.0

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate((rotationRef.current * Math.PI) / 180)
      ctx.translate(-w / 2, -h / 2)

      for (const star of starsRef.current) {
        const t = timestamp * 0.001

        // Layer 3 sine waves at different frequencies for irregular scintillation
        const wave1 = Math.sin(t * star.freq1 + star.phase1)
        const wave2 = Math.sin(t * star.freq2 + star.phase2) * 0.5
        const wave3 = Math.sin(t * star.freq3 + star.phase3) * 0.25

        // Combine waves: normalized to 0–1 range
        const combined = (wave1 + wave2 + wave3 + 1.75) / 3.5

        // Occasional bright flare: sharp spike using pow
        const flareCycle = Math.sin(t * star.flareSpeed + star.flarePhase)
        const flare = Math.pow(Math.max(0, flareCycle), 12) * 0.6

        const twinkle = Math.min(1, combined * 0.7 + 0.3 + flare)
        const alpha = star.baseOpacity * opacityMult * twinkle

        // Slight radius pulse on flare
        const r = star.radius + flare * 0.8

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
