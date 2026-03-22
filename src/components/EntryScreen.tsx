"use client"

import { useState } from "react"

export default function EntryScreen() {
  const [visible, setVisible] = useState(true)

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
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          color: "rgba(255,180,160,0.55)",
          fontFamily: "monospace",
          fontSize: 13,
          letterSpacing: 10,
          userSelect: "none",
        }}
      >
        LISTEN
      </span>
    </div>
  )
}
