"use client"

import { useEffect, useRef, useState } from "react"

// Pre-built grain color strings — avoids string construction per pixel in the hot loop
const GRAIN_COLORS = [
  "rgba(255,220,180,0.02)",
  "rgba(255,220,180,0.03)",
  "rgba(255,220,180,0.04)",
  "rgba(255,220,180,0.05)",
  "rgba(255,220,180,0.06)",
]

// Deterministic pseudo-random. Same seed+index always returns same value.
function seededRand(seed: number, index: number): number {
  const x = Math.sin(seed * 9301 + index * 49297 + 233) * 1000
  return x - Math.floor(x)
}

// Draws a terrain ridge and returns the Y value at each control point (for cactus placement).
// Uses quadraticCurveTo through midpoints for natural-looking silhouettes.
function drawRidge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number,
  seedOffset: number,
  baseRatio: number,
  ampRatio: number,
  numPoints: number
): number[] {
  const baseY = h * baseRatio
  const amp = h * ampRatio

  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < numPoints; i++) {
    const x = (i / (numPoints - 1)) * w
    // Two frequency layers: coarse (mesa) + fine (detail)
    const coarse = seededRand(seed, seedOffset + Math.floor(i / 4)) * 2 - 1
    const fine = seededRand(seed, seedOffset + 50 + i) * 2 - 1
    const y = baseY - amp * (0.7 * coarse + 0.3 * fine)
    pts.push({ x, y })
  }

  ctx.beginPath()
  ctx.moveTo(0, h)
  ctx.lineTo(pts[0].x, pts[0].y)

  for (let i = 0; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2
    const my = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
  }

  const last = pts[pts.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.lineTo(w, h)
  ctx.closePath()
  ctx.fillStyle = "#000000"
  ctx.fill()

  return pts.map((p) => p.y)
}

// Draws a single saguaro cactus silhouette: trunk + two L-shaped arms
function drawCactus(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  seed: number,
  seedOffset: number
) {
  const trunkH = 30 + seededRand(seed, seedOffset) * 50
  const trunkW = 6 + seededRand(seed, seedOffset + 1) * 6
  const armW = Math.max(4, trunkW * 0.75)

  ctx.fillStyle = "#000000"

  // Trunk
  ctx.fillRect(cx - trunkW / 2, baseY - trunkH, trunkW, trunkH)

  // Left arm: horizontal connector then vertical segment going up
  const leftJointH = trunkH * (0.4 + seededRand(seed, seedOffset + 2) * 0.25)
  const leftArmLen = trunkW * (1.5 + seededRand(seed, seedOffset + 3) * 2.5)
  const leftVertH = trunkH * (0.15 + seededRand(seed, seedOffset + 4) * 0.2)
  ctx.fillRect(cx - trunkW / 2 - leftArmLen, baseY - leftJointH - armW / 2, leftArmLen, armW)
  ctx.fillRect(cx - trunkW / 2 - leftArmLen, baseY - leftJointH - leftVertH, armW, leftVertH)

  // Right arm
  const rightJointH = trunkH * (0.4 + seededRand(seed, seedOffset + 5) * 0.25)
  const rightArmLen = trunkW * (1.5 + seededRand(seed, seedOffset + 6) * 2.5)
  const rightVertH = trunkH * (0.15 + seededRand(seed, seedOffset + 7) * 0.2)
  ctx.fillRect(cx + trunkW / 2, baseY - rightJointH - armW / 2, rightArmLen, armW)
  ctx.fillRect(cx + trunkW / 2 + rightArmLen - armW, baseY - rightJointH - rightVertH, armW, rightVertH)
}

interface SceneCanvasProps {
  sceneIndex: number
}

export default function SceneCanvas({ sceneIndex }: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  // sceneIndexRef drives drawing — updated mid-transition so the RAF always reads the right seed
  const sceneIndexRef = useRef(sceneIndex)

  const [canvasStyle, setCanvasStyle] = useState<React.CSSProperties>({
    opacity: 1,
    transform: "scale(1.0)",
    transition: "opacity 800ms ease-out",
  })

  // Scene transition: fade+scale out → swap seed → fade in
  useEffect(() => {
    if (sceneIndex === sceneIndexRef.current) return

    // Exit: fade out and rush toward camera
    setCanvasStyle({
      opacity: 0,
      transform: "scale(1.25)",
      transition: "opacity 800ms ease-in, transform 800ms ease-in",
    })

    const timer = setTimeout(() => {
      sceneIndexRef.current = sceneIndex

      // Snap back to scale(1) with no transition, then trigger fade-in on next paint
      setCanvasStyle({
        opacity: 0,
        transform: "scale(1.0)",
        transition: "none",
      })
      requestAnimationFrame(() => {
        setCanvasStyle({
          opacity: 1,
          transform: "scale(1.0)",
          transition: "opacity 800ms ease-out",
        })
      })
    }, 800)

    return () => clearTimeout(timer)
  }, [sceneIndex])

  // RAF draw loop — reads sceneIndexRef dynamically, never re-mounts
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
      const w = canvas.width
      const h = canvas.height
      const seed = sceneIndexRef.current

      // ── Layer 1: Sky gradient ──────────────────────────────────────────────
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
      skyGrad.addColorStop(0, "#020008")
      skyGrad.addColorStop(0.6, "#1a0005")
      skyGrad.addColorStop(0.85, "#2d0008")
      skyGrad.addColorStop(1, "#2d0008")
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // ── Layer 2: Moon ──────────────────────────────────────────────────────
      const moonX = w * (0.2 + seededRand(seed, 0) * 0.6)
      const moonY = h * (0.1 + seededRand(seed, 1) * 0.3)
      const moonR = 18 + seededRand(seed, 2) * 14

      // Outer diffuse glow
      const glowGrad = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3)
      glowGrad.addColorStop(0, "rgba(139,0,0,0.30)")
      glowGrad.addColorStop(0.5, "rgba(139,0,0,0.08)")
      glowGrad.addColorStop(1, "transparent")
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2)
      ctx.fill()

      // Moon body with slight off-center highlight
      const moonGrad = ctx.createRadialGradient(
        moonX - moonR * 0.2, moonY - moonR * 0.2, 0,
        moonX, moonY, moonR
      )
      moonGrad.addColorStop(0, "#cc1100")
      moonGrad.addColorStop(0.7, "#aa0800")
      moonGrad.addColorStop(1, "#8b0000")
      ctx.fillStyle = moonGrad
      ctx.beginPath()
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2)
      ctx.fill()

      // ── Layer 3: Atmospheric haze ──────────────────────────────────────────
      // Slow sine pulse between 0.5 and 0.8 over a ~20s cycle
      const hazeOpacity = 0.65 + 0.15 * Math.sin((timestamp / 20000) * Math.PI * 2)
      const horizonY = h * 0.85
      const hazeTop = horizonY - h * 0.25
      const hazeGrad = ctx.createLinearGradient(0, hazeTop, 0, horizonY)
      hazeGrad.addColorStop(0, "transparent")
      hazeGrad.addColorStop(1, `rgba(45,0,8,${hazeOpacity.toFixed(3)})`)
      ctx.fillStyle = hazeGrad
      ctx.fillRect(0, hazeTop, w, h - hazeTop)

      // ── Layer 4: Distant mountain ridge (~72%) ─────────────────────────────
      // Gentle rolling mesa formations — low amplitude, smooth
      drawRidge(ctx, w, h, seed, 100, 0.72, 0.06, 50)

      // ── Layer 5: Middle ridge (~80%) ───────────────────────────────────────
      // More dramatic — higher amplitude, jagged rock formations
      drawRidge(ctx, w, h, seed, 200, 0.80, 0.09, 60)

      // ── Layer 6: Foreground terrain + cacti (~88%) ─────────────────────────
      const fgYValues = drawRidge(ctx, w, h, seed, 300, 0.88, 0.04, 80)

      const numCacti = 3 + Math.floor(seededRand(seed, 400) * 5) // 3–7 cacti
      for (let c = 0; c < numCacti; c++) {
        const cx = w * (0.05 + seededRand(seed, 401 + c * 10) * 0.9)
        const idx = Math.round((cx / w) * (fgYValues.length - 1))
        const baseY = fgYValues[Math.max(0, Math.min(idx, fgYValues.length - 1))]
        drawCactus(ctx, cx, baseY, seed, 410 + c * 10)
      }

      // ── Layer 7: Film grain ────────────────────────────────────────────────
      // 12000 warm off-white pixels scattered across the full canvas each frame.
      // Re-randomised every frame so the grain lives and breathes.
      for (let i = 0; i < 12000; i++) {
        ctx.fillStyle = GRAIN_COLORS[Math.floor(Math.random() * GRAIN_COLORS.length)]
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1)
      }

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
        transformOrigin: "bottom center",
        ...canvasStyle,
      }}
    />
  )
}
