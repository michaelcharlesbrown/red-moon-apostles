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

  const fireAudioStart = () => {
    if (audioStarted.current) return
    audioStarted.current = true
    window.dispatchEvent(new CustomEvent("rma-audio-start"))
  }

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      fireAudioStart()
      onWheel(e.deltaY)

      // Debounced scene advance
      const now = Date.now()
      if (now - lastAdvanceTime.current > 900) {
        lastAdvanceTime.current = now
        onAdvance()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      onCursorMove(e.clientX, e.clientY)
    }

    const handleClick = () => {
      fireAudioStart()
    }

    window.addEventListener("wheel", handleWheel, { passive: false })
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("wheel", handleWheel)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
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
