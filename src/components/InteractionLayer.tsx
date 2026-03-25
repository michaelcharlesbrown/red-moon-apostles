"use client"

import { useEffect, useRef } from "react"

interface InteractionLayerProps {
  onCursorMove: (x: number, y: number) => void
  onWheel: (deltaY: number) => void
  onAdvance: () => void
}

export default function InteractionLayer({
  onCursorMove,
  onWheel,
  onAdvance,
}: InteractionLayerProps) {
  const audioStarted = useRef(false)
  const lastAdvanceTime = useRef(0)
  const lastTouchY = useRef(0)

  const fireAudioStart = () => {
    if (audioStarted.current) return
    audioStarted.current = true
    window.dispatchEvent(new CustomEvent("rma-audio-start"))
  }

  useEffect(() => {
    // ── Desktop: wheel ──────────────────────────────────────────────────────
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      fireAudioStart()
      onWheel(e.deltaY)

      const now = Date.now()
      if (now - lastAdvanceTime.current > 900) {
        lastAdvanceTime.current = now
        onAdvance()
      }
    }

    // ── Desktop: mouse ──────────────────────────────────────────────────────
    const handleMouseMove = (e: MouseEvent) => {
      onCursorMove(e.clientX, e.clientY)
    }

    const handleClick = () => {
      fireAudioStart()
    }

    // ── Mobile: touch ───────────────────────────────────────────────────────
    const handleTouchStart = (e: TouchEvent) => {
      fireAudioStart()
      const touch = e.touches[0]
      if (!touch) return
      lastTouchY.current = touch.clientY
      onCursorMove(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (!touch) return

      // Cursor position → audio parameters
      onCursorMove(touch.clientX, touch.clientY)

      // Vertical delta → scroll parallax + scene advance
      const deltaY = touch.clientY - lastTouchY.current
      lastTouchY.current = touch.clientY

      if (Math.abs(deltaY) > 1) {
        onWheel(deltaY * 3)

        const now = Date.now()
        if (Math.abs(deltaY) > 8 && now - lastAdvanceTime.current > 900) {
          lastAdvanceTime.current = now
          onAdvance()
        }
      }
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)
    window.addEventListener("touchstart", handleTouchStart, { passive: false })
    window.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
      window.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
    }
  }, [onCursorMove, onWheel, onAdvance])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
      }}
    />
  )
}
