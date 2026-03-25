"use client"

import { useState, useEffect } from "react"

export default function EntryScreen() {
  const [visible, setVisible] = useState(true)
  const [showListen, setShowListen] = useState(false)

  useEffect(() => {
    const handler = () => {
      // Preloader fade takes 4s — show LISTEN after it's mostly faded
      setTimeout(() => setShowListen(true), 3500)
    }
    window.addEventListener("rma-preloader-done", handler)
    return () => window.removeEventListener("rma-preloader-done", handler)
  }, [])

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("rma-audio-start"))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        cursor: "pointer",
        paddingTop: "38vh",
      }}
    >
      <span
        style={{
          color: "rgba(255,180,160,0.55)",
          fontFamily: "monospace",
          fontSize: 13,
          letterSpacing: 10,
          userSelect: "none",
          opacity: showListen ? 1 : 0,
          transition: "opacity 2s ease-in",
        }}
      >
        LISTEN
      </span>
    </div>
  )
}
