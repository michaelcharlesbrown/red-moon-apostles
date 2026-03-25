"use client"

import { useEffect, useRef, useCallback, MutableRefObject } from "react"

interface TerrainCanvasProps {
  scrollOffsetRef: MutableRefObject<number>
  fgIndex: number
}

function sr(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000
  return x - Math.floor(x)
}

// Smooth multi-frequency ridgeline — flowing natural silhouette
function ridgeLine(x: number, seed: number, baseY: number, amp: number, freq: number): number {
  return baseY
    + Math.sin(x * freq + seed * 4.2) * amp
    + Math.sin(x * freq * 2.7 + seed * 7.1) * amp * 0.4
    + Math.sin(x * freq * 6.3 + seed * 2.8) * amp * 0.15
    + Math.sin(x * freq * 13.1 + seed * 9.4) * amp * 0.07
}

interface Pt { x: number; y: number }

function fillTri(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, c: Pt, color: string) {
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.lineTo(c.x, c.y)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

// Dark red/crimson shade with subtle per-face variation
function shade(seed: number, idx: number, baseVal: number, range: number): string {
  const faceRand = sr(seed, idx * 17 + 3)
  const val = Math.max(1, Math.min(baseVal + range * 1.8, baseVal + faceRand * range))
  // Dark crimson: red dominant, green/blue very low
  const rv = Math.round(val)
  const gv = Math.round(val * 0.12)
  const bv = Math.round(val * 0.05)
  return `rgb(${rv},${gv},${bv})`
}

// Draw a blended terrain layer:
// - Smooth ridgeline silhouette on top (sampled per-pixel)
// - Triangulated facets filling the body below
function drawBlendedLayer(
  ctx: CanvasRenderingContext2D,
  cssW: number, cssH: number,
  seed: number, baseY: number, amp: number, freq: number,
  segW: number, numRows: number,
  baseVal: number, range: number,
  glowAlpha: number,
) {
  // ── Step 1: Sample smooth ridge at segment intervals ──────────
  const cols = Math.ceil(cssW / segW) + 3
  const bottomY = cssH + 30

  // Ridge row: smooth per-pixel ridgeline sampled at segment points
  const ridgeRow: Pt[] = []
  for (let c = -1; c < cols; c++) {
    const px = c * segW
    ridgeRow.push({ x: px, y: ridgeLine(px, seed, baseY, amp, freq) })
  }

  // Interior rows with stagger + jitter
  const rows: Pt[][] = [ridgeRow]
  for (let r = 1; r <= numRows; r++) {
    const t = r / numRows
    const stagger = (r % 2 === 1) ? segW * 0.5 : 0
    const row: Pt[] = []
    for (let c = -1; c < cols; c++) {
      const baseX = c * segW + stagger
      const jx = (sr(seed, r * 311 + c * 47 + 1) - 0.5) * segW * 0.45
      const jy = (sr(seed, r * 173 + c * 89 + 2) - 0.5) * segW * 0.3
      const ry = ridgeLine(baseX, seed, baseY, amp, freq)
      row.push({ x: baseX + jx, y: ry + (bottomY - ry) * t + jy })
    }
    rows.push(row)
  }

  // ── Step 2: Draw triangulated body ────────────────────────────
  let idx = 0
  for (let r = 0; r < rows.length - 1; r++) {
    const top = rows[r]
    const bot = rows[r + 1]
    const maxLen = Math.min(top.length, bot.length)
    for (let c = 0; c < maxLen - 1; c++) {
      fillTri(ctx, top[c], top[c + 1], bot[c], shade(seed, idx++, baseVal, range))
      fillTri(ctx, top[c + 1], bot[c + 1], bot[c], shade(seed, idx++, baseVal, range))
    }
  }

  // ── Step 3: Redraw smooth ridge edge to clean up jagged triangle tops ─
  // Fill a thin strip along the smooth ridge to mask triangle edges
  ctx.save()
  // Create clip region ABOVE the smooth ridge
  ctx.beginPath()
  ctx.moveTo(-segW, 0)
  ctx.lineTo(cssW + segW, 0)
  ctx.lineTo(cssW + segW, cssH)
  for (let x = cssW; x >= 0; x--) {
    ctx.lineTo(x, ridgeLine(x, seed, baseY, amp, freq))
  }
  ctx.lineTo(-segW, ridgeLine(0, seed, baseY, amp, freq))
  ctx.closePath()
  ctx.clip()
  // Clear everything above the smooth ridge — removes triangle overshoot
  ctx.clearRect(0, 0, cssW, cssH)
  ctx.restore()

  // ── Step 4: Red glow along smooth ridge edge ──────────────────
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(0, cssH)
  for (let x = 0; x <= cssW; x++) {
    ctx.lineTo(x, ridgeLine(x, seed, baseY, amp, freq))
  }
  ctx.lineTo(cssW, cssH)
  ctx.closePath()
  ctx.clip()

  for (let x = 0; x < cssW; x += 4) {
    const ry = ridgeLine(x, seed, baseY, amp, freq)
    const glowH = cssH * 0.04
    const g = ctx.createRadialGradient(x, ry, 0, x, ry + glowH * 0.3, glowH)
    g.addColorStop(0, `rgba(150,20,0,${(glowAlpha).toFixed(3)})`)
    g.addColorStop(0.3, `rgba(100,10,0,${(glowAlpha * 0.5).toFixed(3)})`)
    g.addColorStop(0.7, `rgba(50,4,0,${(glowAlpha * 0.2).toFixed(3)})`)
    g.addColorStop(1, "transparent")
    ctx.fillStyle = g
    ctx.fillRect(x, ry, 4, glowH)
  }
  ctx.restore()
}

export default function TerrainCanvas({ scrollOffsetRef, fgIndex }: TerrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef(0)
  const readyRef     = useRef(false)

  const drawTerrain = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const cssW = window.innerWidth
    const cssH = window.innerHeight
    canvas.width  = cssW * dpr
    canvas.height = cssH * dpr
    canvas.style.width  = cssW + "px"
    canvas.style.height = cssH + "px"
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    const seed = fgIndex

    // ── Horizon haze ─────────────────────────────────────────────
    const hazeH = cssH * 0.08
    const hazeGrad = ctx.createLinearGradient(0, cssH * 0.62 - hazeH, 0, cssH * 0.64)
    hazeGrad.addColorStop(0, "transparent")
    hazeGrad.addColorStop(0.5, "rgba(80,8,0,0.03)")
    hazeGrad.addColorStop(1, "rgba(40,4,0,0.02)")
    ctx.fillStyle = hazeGrad
    ctx.fillRect(0, cssH * 0.62 - hazeH, cssW, hazeH + cssH * 0.02)

    // ── Distant background ridge — smooth + subtle facets ────────
    //                                seed       baseY        amp         freq   segW rows baseVal range glow
    drawBlendedLayer(ctx, cssW, cssH, seed + 7,  cssH * 0.68, cssH * 0.03, 0.002, 80,  2,   8,      6,    0.035)

    // ── Main foreground terrain — smooth + darker facets ─────────
    drawBlendedLayer(ctx, cssW, cssH, seed,      cssH * 0.74, cssH * 0.05, 0.003, 55,  3,   4,      7,    0.05)

  }, [fgIndex])

  useEffect(() => {
    drawTerrain()
    const handleResize = () => drawTerrain()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawTerrain])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const animate = (timestamp: number) => {
      container.style.opacity = String(0.975 + 0.025 * Math.sin(timestamp * Math.PI * 2 / 40000))
      container.style.transform = `translateY(${scrollOffsetRef.current * 0.18}px)`

      if (!readyRef.current) {
        readyRef.current = true
        window.dispatchEvent(new CustomEvent("rma-layer-ready", { detail: "terrain" }))
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  )
}
