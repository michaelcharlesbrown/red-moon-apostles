"use client"

import { useEffect, useRef } from "react"

export default function SunCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const draw = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const cx = canvas.width * 0.5
      const cy = canvas.height * 0.38
      const radius = canvas.height * 0.26

      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#000000"
      ctx.fill()
    }

    draw()
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
