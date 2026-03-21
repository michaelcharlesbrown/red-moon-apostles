"use client"

import { useEffect, useRef, useState } from "react"

interface AtmosphereLayerProps {
  mgIndex: number
  cursorY: number
}

const BLEND_MODES: string[] = ["screen", "screen", "overlay", "soft-light"]

function drawState(ctx: CanvasRenderingContext2D, state: number, w: number, h: number, timestamp: number) {
  ctx.clearRect(0, 0, w, h)

  switch (state) {
    case 0: {
      // Warm horizon bloom — DEV: cranked up ~3x
      const cy = h * 0.85 + Math.sin(timestamp * 0.0003) * h * 0.02
      const grad = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, w * 0.7)
      grad.addColorStop(0, "rgba(220, 80, 15, 0.9)")
      grad.addColorStop(0.5, "rgba(180, 60, 10, 0.5)")
      grad.addColorStop(1, "transparent")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 1: {
      // Cold mist — DEV: cranked up ~3x
      const pulseOpacity = 0.7 + 0.3 * ((Math.sin(timestamp * 0.00025) + 1) / 2)
      const grad = ctx.createLinearGradient(0, h, 0, h * 0.4)
      grad.addColorStop(0, `rgba(100, 160, 210, ${0.75 * pulseOpacity})`)
      grad.addColorStop(0.6, `rgba(100, 140, 180, ${0.35 * pulseOpacity})`)
      grad.addColorStop(1, "transparent")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 2: {
      // Film grain vignette — DEV: cranked up ~3x
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.7)
      grad.addColorStop(0, "transparent")
      grad.addColorStop(1, "rgba(0, 0, 0, 0.85)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // 2400 random grain pixels, bigger and brighter
      const warmColors = [
        [220, 170, 120],
        [200, 150, 100],
        [240, 190, 140],
        [180, 130, 90],
      ]
      for (let i = 0; i < 2400; i++) {
        const gx = Math.random() * w
        const gy = Math.random() * h
        const c = warmColors[Math.floor(Math.random() * warmColors.length)]
        const opacity = 0.06 + Math.random() * 0.18
        ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${opacity})`
        ctx.fillRect(gx, gy, 2, 2)
      }
      break
    }
    case 3: {
      // Violet color wash — DEV: cranked up ~3x
      const shift = (Math.sin(timestamp * 0.0001) + 1) / 2
      const grad = ctx.createLinearGradient(0, 0, w, 0)
      grad.addColorStop(0, `rgba(80, 20, 160, ${0.85 * (1 - shift * 0.5)})`)
      grad.addColorStop(1, `rgba(80, 20, 160, ${0.85 * (0.5 + shift * 0.5)})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      break
    }
  }
}

export default function AtmosphereLayer({ mgIndex, cursorY }: AtmosphereLayerProps) {
  const canvasARef = useRef<HTMLCanvasElement>(null)
  const canvasBRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const [activeCanvas, setActiveCanvas] = useState<"A" | "B">("A")
  const prevIndexRef = useRef(mgIndex)

  // Crossfade on mgIndex change
  useEffect(() => {
    if (mgIndex !== prevIndexRef.current) {
      setActiveCanvas(prev => (prev === "A" ? "B" : "A"))
      prevIndexRef.current = mgIndex
    }
  }, [mgIndex])

  // Animation loop
  useEffect(() => {
    const canvasA = canvasARef.current
    const canvasB = canvasBRef.current
    if (!canvasA || !canvasB) return

    const ctxA = canvasA.getContext("2d")
    const ctxB = canvasB.getContext("2d")
    if (!ctxA || !ctxB) return

    const resize = () => {
      canvasA.width = window.innerWidth
      canvasA.height = window.innerHeight
      canvasB.width = window.innerWidth
      canvasB.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Track which state each canvas is drawing
    let stateA = activeCanvas === "A" ? mgIndex : prevIndexRef.current
    let stateB = activeCanvas === "B" ? mgIndex : prevIndexRef.current

    const animate = (timestamp: number) => {
      stateA = activeCanvas === "A" ? mgIndex : (mgIndex - 1 + 4) % 4
      stateB = activeCanvas === "B" ? mgIndex : (mgIndex - 1 + 4) % 4
      drawState(ctxA, stateA, canvasA.width, canvasA.height, timestamp)
      drawState(ctxB, stateB, canvasB.width, canvasB.height, timestamp)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [mgIndex, activeCanvas])

  const opacity = Math.min(0.6 + cursorY * 0.5, 1.0)

  return (
    <>
      <canvas
        ref={canvasARef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          opacity: activeCanvas === "A" ? opacity : 0,
          transition: "opacity 1000ms ease-in-out",
          mixBlendMode: BLEND_MODES[activeCanvas === "A" ? mgIndex : (mgIndex - 1 + 4) % 4] as React.CSSProperties["mixBlendMode"],
        }}
      />
      <canvas
        ref={canvasBRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          opacity: activeCanvas === "B" ? opacity : 0,
          transition: "opacity 1000ms ease-in-out",
          mixBlendMode: BLEND_MODES[activeCanvas === "B" ? mgIndex : (mgIndex - 1 + 4) % 4] as React.CSSProperties["mixBlendMode"],
        }}
      />
    </>
  )
}
