"use client"

import { useEffect, useRef, useState } from "react"

const REQUIRED_LAYERS = new Set(["sky", "cloud", "terrain", "sun"])

export default function Preloader() {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)
  const receivedRef = useRef(new Set<string>())

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string
      receivedRef.current.add(detail)

      if (REQUIRED_LAYERS.size === receivedRef.current.size) {
        // All layers painted — start fade
        setFading(true)
      }
    }

    window.addEventListener("rma-layer-ready", handler)
    return () => window.removeEventListener("rma-layer-ready", handler)
  }, [])

  useEffect(() => {
    if (!fading) return
    const timer = setTimeout(() => {
      setGone(true)
      window.dispatchEvent(new CustomEvent("rma-preloader-done"))
    }, 4000)
    return () => clearTimeout(timer)
  }, [fading])

  if (gone) return null

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "#000000",
        pointerEvents: "none",
        opacity: fading ? 0 : 1,
        transition: "opacity 4s ease-out",
      }}
    />
  )
}
