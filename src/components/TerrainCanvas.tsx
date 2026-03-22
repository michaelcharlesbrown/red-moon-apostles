"use client"

import { useEffect, useRef, MutableRefObject } from "react"

interface TerrainCanvasProps {
  scrollOffsetRef: MutableRefObject<number>
  fgIndex: number
}

// Deterministic pseudo-random — same seed+i always returns same value
function sr(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000
  return x - Math.floor(x)
}

// Ridge profile — four frequency layers give natural geological silhouette
function ridgeLine(x: number, seed: number, baseY: number, amp: number, freq: number): number {
  return baseY
    + Math.sin(x * freq       + seed * 4.2) * amp
    + Math.sin(x * freq * 2.7 + seed * 7.1) * amp * 0.4
    + Math.sin(x * freq * 6.3 + seed * 2.8) * amp * 0.15
    + Math.sin(x * freq * 13.1+ seed * 9.4) * amp * 0.07
}

// Surface noise — modulates terrain colour per-pixel.
// Positive → warmer/lighter (light-facing). Negative → deeper shadow.
function surfaceNoise(x: number, y: number, seed: number): number {
  return Math.sin(x * 0.08 + seed * 3.1) * Math.cos(y * 0.06 + seed * 7.3) * 0.5
       + Math.sin(x * 0.23 + seed * 5.7) * Math.cos(y * 0.19 + seed * 2.1) * 0.3
       + Math.sin(x * 0.71 + seed * 1.9) * Math.cos(y * 0.67 + seed * 8.4) * 0.2
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  cx: number, baseY: number,
  seed: number, off: number
) {
  const trunkH = 30 + sr(seed, off)      * 50
  const trunkW = 6  + sr(seed, off + 1)  * 6
  const armW   = Math.max(4, trunkW * 0.75)

  ctx.fillStyle = "#0a0000"

  ctx.fillRect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH)

  const ljH  = trunkH * (0.4  + sr(seed, off + 2) * 0.25)
  const laLen = trunkW * (1.5  + sr(seed, off + 3) * 2.5)
  const lvH  = trunkH * (0.15 + sr(seed, off + 4) * 0.2)
  ctx.fillRect(cx - trunkW / 2 - laLen, baseY - ljH - armW / 2, laLen, armW)
  ctx.fillRect(cx - trunkW / 2 - laLen, baseY - ljH - lvH,      armW,  lvH)

  const rjH  = trunkH * (0.4  + sr(seed, off + 5) * 0.25)
  const raLen = trunkW * (1.5  + sr(seed, off + 6) * 2.5)
  const rvH  = trunkH * (0.15 + sr(seed, off + 7) * 0.2)
  ctx.fillRect(cx + trunkW / 2,              baseY - rjH - armW / 2, raLen, armW)
  ctx.fillRect(cx + trunkW / 2 + raLen - armW, baseY - rjH - rvH,   armW,  rvH)
}

// Build a clipping path from the ridge line — per-pixel for smooth silhouette
function buildRidgePath(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  seed: number, baseY: number, amp: number, freq: number
) {
  ctx.beginPath()
  ctx.moveTo(0, h)
  for (let x = 0; x <= w; x++) {
    ctx.lineTo(x, ridgeLine(x, seed, baseY, amp, freq))
  }
  ctx.lineTo(w, h)
  ctx.closePath()
}

export default function TerrainCanvas({ scrollOffsetRef, fgIndex }: TerrainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef(0)
  const fgRef     = useRef(fgIndex)

  useEffect(() => { fgRef.current = fgIndex }, [fgIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = (timestamp: number) => {
      const w    = canvas.width
      const h    = canvas.height
      const seed = fgRef.current
      const biome = fgRef.current % 3

      ctx.clearRect(0, 0, w, h)

      // ── Biome parameters ─────────────────────────────────────────
      let baseY: number, amp: number, freq: number

      if (biome === 0) {
        // Rocky Mountains — dramatic ridgeline
        baseY = h * (0.68 + sr(seed, 99) * 0.04)
        amp   = h * 0.12
        freq  = 0.003
      } else if (biome === 1) {
        // Desert Dunes — low smooth rolling profile
        baseY = h * (0.72 + sr(seed, 99) * 0.04)
        amp   = h * 0.10
        freq  = 0.0015
      } else {
        // Rocky Badlands — flat plateau, low amplitude
        baseY = h * (0.74 + sr(seed, 99) * 0.04)
        amp   = h * 0.04
        freq  = 0.005
      }

      // ── Horizon haze ─────────────────────────────────────────────
      const hazeH = h * 0.08
      const hazeGrad = ctx.createLinearGradient(0, baseY - hazeH, 0, baseY)
      hazeGrad.addColorStop(0, "transparent")
      hazeGrad.addColorStop(1, "rgba(70,8,0,0.22)")
      ctx.fillStyle = hazeGrad
      ctx.fillRect(0, baseY - hazeH, w, hazeH)

      // ── Terrain silhouette — smooth path filled with gradient ────
      buildRidgePath(ctx, w, h, seed, baseY, amp, freq)
      const fillGrad = ctx.createLinearGradient(0, baseY - amp, 0, h)
      fillGrad.addColorStop(0.0, "#1e0000")
      fillGrad.addColorStop(0.3, "#140000")
      fillGrad.addColorStop(1.0, "#0d0000")
      ctx.fillStyle = fillGrad
      ctx.fill()

      // ── Surface noise texture — clipped to terrain shape ─────────
      ctx.save()
      buildRidgePath(ctx, w, h, seed, baseY, amp, freq)
      ctx.clip()

      for (let x = 0; x < w; x += 4) {
        const topY = Math.floor(ridgeLine(x, seed, baseY, amp, freq))
        for (let y = topY; y < h; y += 4) {
          const n = surfaceNoise(x, y, seed)
          let r: number, g: number

          if (n > 0.15) {
            // Light-facing surface: #200400 → #3d0800
            const t = Math.min((n - 0.15) / 0.85, 1)
            r = Math.floor(0x20 + t * (0x3d - 0x20))
            g = Math.floor(0x04 + t * (0x08 - 0x04))
          } else if (n < -0.15) {
            // Deep shadow / crevice: #0d0000 → #050000
            const t = Math.min((-n - 0.15) / 0.85, 1)
            r = Math.floor(0x0d - t * (0x0d - 0x05))
            g = 0
          } else {
            // Base tone: #0d0000 → #1e0000
            const t = (n + 0.15) / 0.30
            r = Math.floor(0x0d + t * (0x1e - 0x0d))
            g = 0
          }

          ctx.fillStyle = `rgb(${r},${g},0)`
          ctx.fillRect(x, y, 4, 4)
        }
      }

      ctx.restore()

      // ── Atmospheric edge glow — red haze at terrain–sky boundary ─
      for (let x = 0; x < w; x += 3) {
        const ry = ridgeLine(x, seed, baseY, amp, freq)
        const glowGrad = ctx.createLinearGradient(0, ry - 24, 0, ry + 4)
        glowGrad.addColorStop(0, "transparent")
        glowGrad.addColorStop(1, "rgba(140,30,0,0.3)")
        ctx.fillStyle = glowGrad
        ctx.fillRect(x, ry - 24, 3, 28)
      }

      // ── Biome-specific elements ──────────────────────────────────
      if (biome === 0) {
        // Rocky Mountains — 3–5 sharp spires above main ridge
        const numSpires = 3 + Math.floor(sr(seed, 50) * 3)
        for (let i = 0; i < numSpires; i++) {
          const sx = w * (0.08 + sr(seed, 51 + i) * 0.84)
          const ry = ridgeLine(sx, seed, baseY, amp, freq)
          const sh = h * (0.05 + sr(seed, 61 + i) * 0.07)
          const sw = 10 + sr(seed, 71 + i) * 14
          ctx.beginPath()
          ctx.moveTo(sx,         ry - sh)
          ctx.lineTo(sx - sw / 2, ry + 2)
          ctx.lineTo(sx + sw / 2, ry + 2)
          ctx.closePath()
          // Noise-modulated spire colour
          const n = surfaceNoise(sx, ry - sh * 0.5, seed)
          const r = Math.floor(0x10 + Math.max(0, n) * 0x18)
          ctx.fillStyle = `rgb(${r},0,0)`
          ctx.fill()
        }

      } else if (biome === 1) {
        // Desert Dunes — 4–6 saguaro cacti
        const numCacti = 4 + Math.floor(sr(seed, 50) * 3)
        for (let i = 0; i < numCacti; i++) {
          const cx = w * (0.05 + sr(seed, 51 + i * 10) * 0.90)
          const ry = ridgeLine(cx, seed, baseY, amp, freq)
          drawCactus(ctx, cx, ry, seed, 60 + i * 10)
        }

      } else {
        // Rocky Badlands — mesa formations + scattered boulders
        const numMesas = 2 + Math.floor(sr(seed, 50) * 3)
        for (let i = 0; i < numMesas; i++) {
          const mx  = w * (0.1  + sr(seed, 51 + i) * 0.80)
          const mw  = w * (0.06 + sr(seed, 61 + i) * 0.10)
          const mh  = h * (0.04 + sr(seed, 71 + i) * 0.05)
          const ry  = ridgeLine(mx, seed, baseY, amp, freq)
          const n   = surfaceNoise(mx, ry - mh * 0.5, seed)
          const r   = Math.floor(0x10 + Math.max(0, n) * 0x18)
          ctx.fillStyle = `rgb(${r},0,0)`
          ctx.fillRect(mx - mw / 2, ry - mh, mw, mh)
          // Mesa cap (slightly lighter edge)
          ctx.fillStyle = `rgba(40,4,0,0.6)`
          ctx.fillRect(mx - mw / 2, ry - mh, mw, 3)
        }

        const numBoulders = 4 + Math.floor(sr(seed, 80) * 5)
        for (let i = 0; i < numBoulders; i++) {
          const bx = w * (0.03 + sr(seed, 81 + i) * 0.94)
          const ry = ridgeLine(bx, seed, baseY, amp, freq)
          const bw = 12 + sr(seed, 91 + i) * 25
          const bh = bw * (0.4 + sr(seed, 101 + i) * 0.35)
          ctx.beginPath()
          ctx.ellipse(bx, ry - bh * 0.4, bw / 2, bh / 2, 0, 0, Math.PI * 2)
          ctx.fillStyle = "#080000"
          ctx.fill()
        }
      }

      // ── Terrain grain ────────────────────────────────────────────
      for (let i = 0; i < 12000; i++) {
        const alpha = Math.random() * 0.05 + 0.025
        ctx.fillStyle = `rgba(255,170,150,${alpha.toFixed(3)})`
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
      }

      // ── Breath — opacity pulses 0.95–1.0 on 40-second cycle ──────
      canvas.style.opacity = String(0.975 + 0.025 * Math.sin(timestamp * Math.PI * 2 / 40000))

      // ── Parallax transform ───────────────────────────────────────
      canvas.style.transform = `translateY(${scrollOffsetRef.current * 0.18}px)`

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
        zIndex: 3,
        pointerEvents: "none",
      }}
    />
  )
}
