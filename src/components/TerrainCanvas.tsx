"use client"

import { useEffect, useRef, useCallback, MutableRefObject } from "react"

interface TerrainCanvasProps {
  scrollOffsetRef: MutableRefObject<number>
  fgIndex: number
}

// Deterministic pseudo-random
function sr(seed: number, i: number): number {
  const x = Math.sin(seed * 9301 + i * 49297 + 233) * 10000
  return x - Math.floor(x)
}

// Ridge profile — multi-frequency layers for natural silhouette
function ridgeLine(x: number, seed: number, baseY: number, amp: number, freq: number): number {
  return baseY
    + Math.sin(x * freq       + seed * 4.2) * amp
    + Math.sin(x * freq * 2.7 + seed * 7.1) * amp * 0.4
    + Math.sin(x * freq * 6.3 + seed * 2.8) * amp * 0.15
    + Math.sin(x * freq * 13.1+ seed * 9.4) * amp * 0.07
}

// Grain palette
const GRAIN_PALETTE: string[] = []
for (let i = 0; i < 20; i++) {
  const alpha = (0.025 + (i / 19) * 0.05).toFixed(3)
  GRAIN_PALETTE.push(`rgba(255,170,150,${alpha})`)
}

const SVG_NS = "http://www.w3.org/2000/svg"

function createTerrainFilter(svg: SVGSVGElement, seed: number) {
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  const defs = document.createElementNS(SVG_NS, "defs")
  const filter = document.createElementNS(SVG_NS, "filter")
  filter.setAttribute("id", "rma-terrain-tex")
  filter.setAttribute("x", "-5%")
  filter.setAttribute("y", "-5%")
  filter.setAttribute("width", "110%")
  filter.setAttribute("height", "110%")
  filter.setAttribute("color-interpolation-filters", "sRGB")

  // feTurbulence — fractal noise for organic edge warping
  const turb = document.createElementNS(SVG_NS, "feTurbulence")
  turb.setAttribute("type", "fractalNoise")
  turb.setAttribute("baseFrequency", "0.012 0.008")
  turb.setAttribute("numOctaves", "4")
  turb.setAttribute("seed", String(seed))
  turb.setAttribute("result", "tnoise")
  filter.appendChild(turb)

  // feDisplacementMap — subtle organic warping of terrain edges
  const displace = document.createElementNS(SVG_NS, "feDisplacementMap")
  displace.setAttribute("in", "SourceGraphic")
  displace.setAttribute("in2", "tnoise")
  displace.setAttribute("scale", "6")
  displace.setAttribute("xChannelSelector", "R")
  displace.setAttribute("yChannelSelector", "G")
  filter.appendChild(displace)

  defs.appendChild(filter)
  svg.appendChild(defs)
}

export default function TerrainCanvas({ scrollOffsetRef, fgIndex }: TerrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef       = useRef<SVGSVGElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef(0)

  // Draw terrain once per seed/resize change
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

    const seed = fgIndex
    const biome = seed % 3

    // Biome controls ridge shape — terrain stays in bottom third, never near the sun (38%)
    let baseY: number, amp: number, freq: number
    if (biome === 0) {
      // Rocky mountains — tallest peaks still well below sun
      baseY = cssH * (0.78 + sr(seed, 99) * 0.03)
      amp   = cssH * 0.08
      freq  = 0.003
    } else if (biome === 1) {
      // Desert dunes — low rolling forms
      baseY = cssH * (0.82 + sr(seed, 99) * 0.03)
      amp   = cssH * 0.06
      freq  = 0.0015
    } else {
      // Badlands — low plateau
      baseY = cssH * (0.80 + sr(seed, 99) * 0.03)
      amp   = cssH * 0.05
      freq  = 0.004
    }

    ctx.clearRect(0, 0, cssW, cssH)

    // ── Distant background ridge (depth layer) ─────────────────────
    const bgBaseY = baseY - cssH * 0.02
    const bgAmp = amp * 0.5
    const bgFreq = freq * 0.7
    const bgSeed = seed + 7

    ctx.beginPath()
    ctx.moveTo(0, cssH)
    for (let x = 0; x <= cssW; x++) {
      ctx.lineTo(x, ridgeLine(x, bgSeed, bgBaseY, bgAmp, bgFreq))
    }
    ctx.lineTo(cssW, cssH)
    ctx.closePath()
    const bgGrad = ctx.createLinearGradient(0, bgBaseY - bgAmp, 0, cssH)
    bgGrad.addColorStop(0.0, "#0c0000")
    bgGrad.addColorStop(0.15, "#080000")
    bgGrad.addColorStop(0.5, "#050000")
    bgGrad.addColorStop(1.0, "#030000")
    ctx.fillStyle = bgGrad
    ctx.fill()

    // ── Red glow on background ridge — light from above catching the edge ──
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, cssH)
    for (let x = 0; x <= cssW; x++) {
      ctx.lineTo(x, ridgeLine(x, bgSeed, bgBaseY, bgAmp, bgFreq))
    }
    ctx.lineTo(cssW, cssH)
    ctx.closePath()
    ctx.clip()
    for (let x = 0; x < cssW; x += 3) {
      const ry = ridgeLine(x, bgSeed, bgBaseY, bgAmp, bgFreq)
      const glowH = cssH * 0.04
      const g = ctx.createRadialGradient(x, ry, 0, x, ry + glowH * 0.3, glowH)
      g.addColorStop(0, "rgba(180,25,0,0.045)")
      g.addColorStop(0.3, "rgba(120,12,0,0.025)")
      g.addColorStop(0.7, "rgba(60,5,0,0.01)")
      g.addColorStop(1, "transparent")
      ctx.fillStyle = g
      ctx.fillRect(x, ry, 3, glowH)
    }
    ctx.restore()

    // ── Horizon haze — subtle atmospheric glow above terrain ───────
    const hazeH = cssH * 0.08
    const hazeGrad = ctx.createLinearGradient(0, baseY - hazeH, 0, baseY + cssH * 0.02)
    hazeGrad.addColorStop(0, "transparent")
    hazeGrad.addColorStop(0.5, "rgba(100,10,0,0.03)")
    hazeGrad.addColorStop(0.8, "rgba(70,8,0,0.06)")
    hazeGrad.addColorStop(1, "rgba(40,4,0,0.04)")
    ctx.fillStyle = hazeGrad
    ctx.fillRect(0, baseY - hazeH, cssW, hazeH + cssH * 0.02)

    // ── Main foreground terrain silhouette ──────────────────────────
    ctx.beginPath()
    ctx.moveTo(0, cssH)
    for (let x = 0; x <= cssW; x++) {
      ctx.lineTo(x, ridgeLine(x, seed, baseY, amp, freq))
    }
    ctx.lineTo(cssW, cssH)
    ctx.closePath()

    const fillGrad = ctx.createLinearGradient(0, baseY - amp, 0, cssH)
    fillGrad.addColorStop(0.0, "#120100")
    fillGrad.addColorStop(0.08, "#0c0000")
    fillGrad.addColorStop(0.25, "#080000")
    fillGrad.addColorStop(0.5, "#050000")
    fillGrad.addColorStop(1.0, "#020000")
    ctx.fillStyle = fillGrad
    ctx.fill()

    // ── Red glow on foreground ridge — light from the red sky above ──
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(0, cssH)
    for (let x = 0; x <= cssW; x++) {
      ctx.lineTo(x, ridgeLine(x, seed, baseY, amp, freq))
    }
    ctx.lineTo(cssW, cssH)
    ctx.closePath()
    ctx.clip()
    for (let x = 0; x < cssW; x += 3) {
      const ry = ridgeLine(x, seed, baseY, amp, freq)
      const glowH = cssH * 0.05
      const g = ctx.createRadialGradient(x, ry, 0, x, ry + glowH * 0.25, glowH)
      g.addColorStop(0, "rgba(200,30,0,0.055)")
      g.addColorStop(0.2, "rgba(150,18,0,0.035)")
      g.addColorStop(0.5, "rgba(80,8,0,0.015)")
      g.addColorStop(1, "transparent")
      ctx.fillStyle = g
      ctx.fillRect(x, ry, 3, glowH)
    }
    ctx.restore()

    // ── Subtle internal geological layering ─────────────────────────
    // Horizontal bands of slightly different darkness for depth
    for (let i = 0; i < 4; i++) {
      const bandY = baseY + (cssH - baseY) * (0.2 + i * 0.2)
      const bandH = (cssH - baseY) * 0.08
      const bandGrad = ctx.createLinearGradient(0, bandY, 0, bandY + bandH)
      const bandAlpha = 0.04 + sr(seed, 200 + i) * 0.04
      bandGrad.addColorStop(0, "transparent")
      bandGrad.addColorStop(0.5, `rgba(60,6,0,${bandAlpha.toFixed(3)})`)
      bandGrad.addColorStop(1, "transparent")
      ctx.fillStyle = bandGrad

      // Only fill within the terrain shape
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(0, cssH)
      for (let x = 0; x <= cssW; x++) {
        ctx.lineTo(x, ridgeLine(x, seed, baseY, amp, freq))
      }
      ctx.lineTo(cssW, cssH)
      ctx.closePath()
      ctx.clip()
      ctx.fillRect(0, bandY, cssW, bandH)
      ctx.restore()
    }
  }, [fgIndex])

  // Redraw terrain when seed or window size changes
  useEffect(() => {
    drawTerrain()
    const handleResize = () => drawTerrain()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [drawTerrain])

  // Parallax + breath RAF loop (grain now handled by GrainOverlay)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const animate = (timestamp: number) => {
      container.style.opacity = String(0.975 + 0.025 * Math.sin(timestamp * Math.PI * 2 / 40000))
      container.style.transform = `translateY(${scrollOffsetRef.current * 0.18}px)`
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Build SVG filter via DOM API (correct namespace)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const terrainSeed = fgIndex * 251 + 73
    createTerrainFilter(svg, terrainSeed)
  }, [fgIndex])

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
      {/* SVG filter — populated via useEffect with correct SVG namespace */}
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", width: 0, height: 0 }}
      />

      {/* Main terrain canvas — static per seed, SVG-filtered for texture */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          filter: "url(#rma-terrain-tex)",
        }}
      />

    </div>
  )
}
