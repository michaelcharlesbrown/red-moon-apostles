"use client"

import { useEffect, useRef, MutableRefObject } from "react"

interface CloudCanvasProps {
  scrollOffsetRef: MutableRefObject<number>
  mgIndex: number
}

// 3-octave noise — fast enough for 60fps, still turbulent
function cloudNoise(x: number, y: number, t: number, seed: number): number {
  let v = 0, amp = 1, freq = 1
  for (let i = 0; i < 3; i++) {
    v += Math.sin(x * freq * 0.004 + seed * 6.3 + t * 0.00018 * freq)
       * Math.cos(y * freq * 0.005 + seed * 4.1 + t * 0.00013 * freq)
       * amp
    amp  *= 0.5
    freq *= 2.2
  }
  return (v + 1.4) / 2.8
}

// Map noise value to RGBA — returns [r, g, b, a] or null for transparent
function noiseToColor(n: number): [number, number, number, number] | null {
  if (n < 0.35) return null
  if (n < 0.52) return [20,  0, 0, 0.55]
  if (n < 0.65) return [70,  4, 0, 0.65]
  if (n < 0.78) return [130, 12, 0, 0.72]
  if (n < 0.88) return [180, 22, 0, 0.78]
  return              [210, 35, 0, 0.82]
}

const SAMPLE = 6 // px — balance between detail and performance

export default function CloudCanvas({ scrollOffsetRef, mgIndex }: CloudCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef(0)
  const timeRef    = useRef(0)
  const mgRef      = useRef(mgIndex)

  useEffect(() => { mgRef.current = mgIndex }, [mgIndex])

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

    const animate = () => {
      timeRef.current += 0.25

      const w    = canvas.width
      const h    = canvas.height
      const seed = mgRef.current
      const t    = timeRef.current

      // Clouds occupy upper 75% only
      const cloudBase = Math.floor(h * 0.75)

      // Use imageData — avoids per-pixel string allocation entirely
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data

      for (let y = 0; y < cloudBase; y += SAMPLE) {
        const horizonFade = 1 - y / cloudBase

        for (let x = 0; x < w; x += SAMPLE) {
          const n   = cloudNoise(x, y, t, seed)
          const col = noiseToColor(n)
          if (!col) continue

          const [r, g, b, a] = col
          const alpha = Math.floor(a * horizonFade * 255)

          // Fill SAMPLE×SAMPLE block
          for (let dy = 0; dy < SAMPLE && y + dy < cloudBase; dy++) {
            for (let dx = 0; dx < SAMPLE && x + dx < w; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4
              // Alpha-blend over black background
              const ea = data[idx + 3] / 255
              const na = alpha / 255
              const oa = na + ea * (1 - na)
              if (oa > 0) {
                data[idx]     = Math.floor((r * na + data[idx]     * ea * (1 - na)) / oa)
                data[idx + 1] = Math.floor((g * na + data[idx + 1] * ea * (1 - na)) / oa)
                data[idx + 2] = Math.floor((b * na + data[idx + 2] * ea * (1 - na)) / oa)
                data[idx + 3] = Math.floor(oa * 255)
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      // ── Cloud grain (fillRect is fine here — random, not structured) ──
      for (let i = 0; i < 6000; i++) {
        const alpha = (Math.random() * 0.04 + 0.02).toFixed(3)
        ctx.fillStyle = `rgba(255,180,160,${alpha})`
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
      }

      // ── Parallax ──────────────────────────────────────────────────
      canvas.style.transform = `translateY(${scrollOffsetRef.current * 0.06}px)`

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
        zIndex: 2,
        pointerEvents: "none",
      }}
    />
  )
}
