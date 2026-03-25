"use client"

import { useEffect, useRef } from "react"

export default function SunCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + "px"
      canvas.style.height = h + "px"

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const cx = w * 0.5
      const cy = h * 0.38
      const radius = Math.min(h * 0.26, w * 0.32)

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#000000"
      ctx.fill()
    }

    draw()
    window.dispatchEvent(new CustomEvent("rma-layer-ready", { detail: "sun" }))
    window.addEventListener("resize", draw)
    return () => window.removeEventListener("resize", draw)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4,
        pointerEvents: "none",
      }}
    />
  )
}
