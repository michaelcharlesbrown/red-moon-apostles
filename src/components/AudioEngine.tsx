"use client"

import { useEffect, useRef } from "react"

interface AudioEngineProps {
  cursorY: number
}

interface StemGroup {
  paths: string[]
  crossfadeDuration: number
  intervalMin: number
  intervalMax: number
}

const STEM_GROUPS: StemGroup[] = [
  {
    paths: ["/audio/low-01.mp3", "/audio/low-02.mp3", "/audio/low-03.mp3"],
    crossfadeDuration: 25,
    intervalMin: 45,
    intervalMax: 75,
  },
  {
    paths: ["/audio/mid-01.mp3", "/audio/mid-02.mp3", "/audio/mid-03.mp3", "/audio/mid-04.mp3"],
    crossfadeDuration: 30,
    intervalMin: 60,
    intervalMax: 90,
  },
  {
    paths: ["/audio/high-01.mp3", "/audio/high-02.mp3", "/audio/high-03.mp3", "/audio/high-04.mp3", "/audio/high-05.mp3"],
    crossfadeDuration: 20,
    intervalMin: 30,
    intervalMax: 55,
  },
]

// Also try test files as fallback
const TEST_FILES = ["/audio/test1.mp3", "/audio/test2.mp3", "/audio/test3.mp3"]

async function loadBuffer(ctx: AudioContext, path: string): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const arr = await res.arrayBuffer()
    return await ctx.decodeAudioData(arr)
  } catch {
    return null
  }
}

export default function AudioEngine({ cursorY }: AudioEngineProps) {
  const audioStarted = useRef(false)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  // Update filter on cursorY change
  useEffect(() => {
    if (!filterRef.current || !ctxRef.current) return
    const targetHz = 80 + cursorY * 8920
    filterRef.current.frequency.linearRampToValueAtTime(targetHz, ctxRef.current.currentTime + 0.08)
  }, [cursorY])

  // Listen for audio start event
  useEffect(() => {
    const handler = async () => {
      console.log("[AudioEngine] handler fired, already started:", audioStarted.current)
      if (audioStarted.current) return
      audioStarted.current = true

      const ctx = new AudioContext()
      console.log("[AudioEngine] ctx state before resume:", ctx.state)
      await ctx.resume()
      console.log("[AudioEngine] ctx state after resume:", ctx.state)
      ctxRef.current = ctx

      // Signal chain: sources -> gains -> master gain -> filter -> destination
      const masterGain = ctx.createGain()
      masterGain.gain.value = 0
      // Gentle fade in over 10 seconds
      masterGain.gain.linearRampToValueAtTime(0.85, ctx.currentTime + 10)

      const filter = ctx.createBiquadFilter()
      filter.type = "lowpass"
      filter.Q.value = 0.8
      filter.frequency.value = 9000 // start fully open — no audible change
      filterRef.current = filter

      masterGain.connect(filter)
      filter.connect(ctx.destination)

      // Try loading stem groups first, fall back to test files
      for (let g = 0; g < STEM_GROUPS.length; g++) {
        const group = STEM_GROUPS[g]
        const buffers: AudioBuffer[] = []

        // Try loading all paths in this group
        for (const path of group.paths) {
          const buf = await loadBuffer(ctx, path)
          if (buf) buffers.push(buf)
        }

        // If no stems loaded, try test file as fallback for this group
        if (buffers.length === 0 && TEST_FILES[g]) {
          const buf = await loadBuffer(ctx, TEST_FILES[g])
          if (buf) buffers.push(buf)
        }

        console.log(`[AudioEngine] group ${g}: ${buffers.length} buffers loaded`)
        if (buffers.length === 0) continue

        // Start first stem
        let currentIndex = Math.floor(Math.random() * buffers.length)
        const startStem = (index: number): { source: AudioBufferSourceNode; gain: GainNode } => {
          const source = ctx.createBufferSource()
          source.buffer = buffers[index]
          source.loop = true
          const gain = ctx.createGain()
          gain.gain.value = 1
          source.connect(gain)
          gain.connect(masterGain)
          source.start(0, Math.random() * source.buffer!.duration)
          return { source, gain }
        }

        let current = startStem(currentIndex)
        console.log(`[AudioEngine] group ${g}: stem playing, duration ${buffers[currentIndex].duration}s`)

        // Only schedule crossfades when there are multiple stems to rotate
        if (buffers.length > 1) {
          const scheduleCrossfade = () => {
            const interval = group.intervalMin + Math.random() * (group.intervalMax - group.intervalMin)

            setTimeout(() => {
              if (ctx.state === "closed") return

              let nextIndex = currentIndex
              while (nextIndex === currentIndex) {
                nextIndex = Math.floor(Math.random() * buffers.length)
              }

              const next = startStem(nextIndex)
              next.gain.gain.value = 0

              const now = ctx.currentTime
              const fadeDuration = group.crossfadeDuration

              current.gain.gain.linearRampToValueAtTime(0, now + fadeDuration)
              next.gain.gain.linearRampToValueAtTime(1, now + fadeDuration)

              setTimeout(() => {
                try { current.source.stop() } catch {}
                current = next
                currentIndex = nextIndex
              }, fadeDuration * 1000 + 500)

              scheduleCrossfade()
            }, interval * 1000)
          }

          scheduleCrossfade()
        }
        // Single buffer: source.loop = true handles continuous playback
      }
    }

    window.addEventListener("rma-audio-start", handler)
    return () => window.removeEventListener("rma-audio-start", handler)
  }, [])

  return null
}
