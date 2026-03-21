"use client"

import { useEffect, useRef } from "react"

interface InteractionLayerProps {
  onScroll: () => void
  onCursorMove: (normalizedY: number) => void
}

export default function InteractionLayer({ onScroll, onCursorMove }: InteractionLayerProps) {
  const lastScrollTime = useRef(0)

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastScrollTime.current < 1200) return
      lastScrollTime.current = now
      onScroll()
    }

    const handleMouseMove = (e: MouseEvent) => {
      onCursorMove(1 - e.clientY / window.innerHeight)
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [onScroll, onCursorMove])

  return null
}
