"use client"

import { useEffect, useRef } from "react"

export default function GrainOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    // Generate a small noise texture on an offscreen canvas
    const size = 256
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.createImageData(size, size)
    let raf = 0
    let lastUpdate = 0

    const generateNoise = () => {
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
      overlay.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`
    }

    const animate = (timestamp: number) => {
      // Update noise ~12fps for film grain flicker
      if (timestamp - lastUpdate > 83) {
        generateNoise()
        lastUpdate = timestamp
      }
      raf = requestAnimationFrame(animate)
    }

    generateNoise()
    raf = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        backgroundRepeat: "repeat",
        opacity: 0.06,
      }}
    />
  )
}
