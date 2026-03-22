"use client"

import { useState } from "react"
import StarField from "@/components/StarField"
import SceneCanvas from "@/components/SceneCanvas"
import AudioEngine from "@/components/AudioEngine"
import InteractionLayer from "@/components/InteractionLayer"
import { useSceneState } from "@/hooks/useSceneState"

export default function Home() {
  const scene = useSceneState()
  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const handleListen = () => {
    setAudioUnlocked(true)
    window.dispatchEvent(new CustomEvent("rma-audio-start"))
  }

  return (
    <div className="rma-root">
      <StarField bgIndex={scene.bgIndex} />
      <SceneCanvas sceneIndex={scene.mgIndex} />
      <AudioEngine cursorY={scene.cursorY} />
      <InteractionLayer onScroll={scene.advance} onCursorMove={scene.setCursorY} />
      {/* LISTEN prompt */}
      {!audioUnlocked && (
        <div
          onClick={handleListen}
          style={{
            position: "fixed",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: "monospace",
            fontSize: 24,
            letterSpacing: 8,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          LISTEN
        </div>
      )}
      {/* DEV ONLY — remove before production */}
      <div
        id="rma-debug"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          fontFamily: "monospace",
          fontSize: 16,
          padding: "8px 12px",
          borderRadius: 4,
          border: "1px solid rgba(255, 255, 255, 0.3)",
          pointerEvents: "none",
        }}
      >
        BG: {scene.bgIndex} | MG: {scene.mgIndex} | FG: {scene.fgIndex}
      </div>
    </div>
  )
}
