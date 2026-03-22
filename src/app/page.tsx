"use client"

import SkyCanvas        from "@/components/SkyCanvas"
import CloudCanvas      from "@/components/CloudCanvas"
import TerrainCanvas    from "@/components/TerrainCanvas"
import SunCanvas        from "@/components/SunCanvas"
import AudioEngine      from "@/components/AudioEngine"
import InteractionLayer from "@/components/InteractionLayer"
import EntryScreen      from "@/components/EntryScreen"
import { useSceneState } from "@/hooks/useSceneState"

export default function Home() {
  const scene = useSceneState()

  return (
    <div className="rma-root">
      <SkyCanvas     scrollOffsetRef={scene.scrollOffsetRef} />
      <CloudCanvas   scrollOffsetRef={scene.scrollOffsetRef} mgIndex={scene.mgIndex} />
      <TerrainCanvas scrollOffsetRef={scene.scrollOffsetRef} fgIndex={scene.fgIndex} />
      <SunCanvas />
      <AudioEngine   cursorX={scene.cursorX} cursorY={scene.cursorY} />
      <InteractionLayer
        onCursorMove={scene.setCursor}
        onWheel={scene.addScrollDelta}
        onAdvance={scene.advance}
      />
      <EntryScreen />
    </div>
  )
}
