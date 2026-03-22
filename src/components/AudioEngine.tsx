"use client"

import { useEffect, useRef } from "react"

interface AudioEngineProps {
  cursorX: number
  cursorY: number
}

// ── Utilities ────────────────────────────────────────────────────────────────

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

// Exponential-decay noise — credible reverb tail, replaceable with real canyon IR
function createSyntheticIR(ctx: AudioContext): AudioBuffer {
  const sr     = ctx.sampleRate
  const length = Math.floor(sr * 2.5)
  const buffer = ctx.createBuffer(2, length, sr)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.8))
    }
  }
  return buffer
}

// Play a shuffled playlist with crossfades — runs independently per group
function startGroup(
  ctx: AudioContext,
  playlist: AudioBuffer[],
  groupGain: GainNode,
  xfadeDuration: number
) {
  let index     = 0
  let activeSrc: AudioBufferSourceNode | null = null
  let activeGain: GainNode | null = null

  const playNext = () => {
    if (ctx.state === "closed") return

    const buffer      = playlist[index % playlist.length]
    index++

    // Random start offset — sounds already in progress on arrival
    const startOffset = Math.random() * Math.max(0, buffer.duration - xfadeDuration - 2)
    const remaining   = buffer.duration - startOffset

    const src  = ctx.createBufferSource()
    src.buffer = buffer

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(
      1,
      ctx.currentTime + Math.min(xfadeDuration * 0.5, remaining * 0.25)
    )

    src.connect(gain)
    gain.connect(groupGain)
    src.start(ctx.currentTime, startOffset)

    // Fade out previous stem
    if (activeGain && activeSrc) {
      const old = { src: activeSrc, gain: activeGain }
      old.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + xfadeDuration)
      setTimeout(() => {
        try { old.src.stop()       } catch { /* already stopped */ }
        try { old.gain.disconnect() } catch { /* already disconnected */ }
      }, (xfadeDuration + 1) * 1000)
    }

    activeSrc  = src
    activeGain = gain

    // Schedule crossfade when this stem nears its end
    const msUntilCrossfade = Math.max(500, (remaining - xfadeDuration) * 1000)
    setTimeout(playNext, msUntilCrossfade)
  }

  playNext()
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AudioEngine({ cursorX, cursorY }: AudioEngineProps) {
  const startedRef = useRef(false)

  // Audio node refs — populated after rma-audio-start
  const ctxRef          = useRef<AudioContext | null>(null)
  const filterRef       = useRef<BiquadFilterNode | null>(null)
  const masterGainRef   = useRef<GainNode | null>(null)
  const wetGainRef      = useRef<GainNode | null>(null)
  const dryGainRef      = useRef<GainNode | null>(null)
  const lowGroupRef     = useRef<GainNode | null>(null)
  const highGroupRef    = useRef<GainNode | null>(null)

  // Cursor state refs — persist across renders without re-mounting audio
  const prevAngleRef    = useRef(0)
  const prevXRef        = useRef(cursorX)
  const prevYRef        = useRef(cursorY)
  const rotAccRef       = useRef(0)
  const masterVolRef    = useRef(0.85)
  const smoothSpeedRef  = useRef(0)

  // ── Four-parameter update — runs on every cursor move ──────────────────────
  useEffect(() => {
    const ctx       = ctxRef.current
    const filter    = filterRef.current
    const masterGain = masterGainRef.current
    const wetGain   = wetGainRef.current
    const dryGain   = dryGainRef.current
    const lowGain   = lowGroupRef.current
    const highGain  = highGroupRef.current
    if (!ctx || !filter || !masterGain || !wetGain || !dryGain || !lowGain || !highGain) return

    const sunCx = window.innerWidth  * 0.5
    const sunCy = window.innerHeight * 0.38

    const dx = cursorX - sunCx
    const dy = cursorY - sunCy

    // — Parameter 1: Distance → Filter cutoff —
    const maxDist = Math.hypot(window.innerWidth, window.innerHeight) * 0.5
    const normDist = Math.min(Math.hypot(dx, dy) / maxDist, 1)
    const targetHz = 300 + normDist * 8700
    filter.frequency.linearRampToValueAtTime(targetHz, ctx.currentTime + 0.08)

    // — Parameter 2: Angle → Reverb wet/dry —
    const angle     = Math.atan2(dy, dx)
    const normAngle = (angle + Math.PI) / (Math.PI * 2) // 0=top-right, 0.5=bottom, 1=top-right
    wetGain.gain.setTargetAtTime(normAngle,       ctx.currentTime, 0.05)
    dryGain.gain.setTargetAtTime(1 - normAngle,   ctx.currentTime, 0.05)

    // — Parameter 3: Rotation speed → Master volume —
    const rawDelta  = angle - prevAngleRef.current
    const normDelta = ((rawDelta + Math.PI) % (Math.PI * 2)) - Math.PI // wrap to [-PI, PI]
    rotAccRef.current += normDelta * 0.3
    rotAccRef.current *= 0.95
    masterVolRef.current = Math.max(0.0, Math.min(1.0,
      masterVolRef.current + rotAccRef.current * 0.01
    ))
    masterGain.gain.linearRampToValueAtTime(masterVolRef.current, ctx.currentTime + 0.1)
    prevAngleRef.current = angle

    // — Parameter 4: Movement speed → Stem group mix —
    const speed     = Math.hypot(cursorX - prevXRef.current, cursorY - prevYRef.current)
    const normSpeed = Math.min(speed / 50, 1)
    smoothSpeedRef.current = smoothSpeedRef.current * 0.9 + normSpeed * 0.1
    const sp = smoothSpeedRef.current
    lowGain.gain.setTargetAtTime(0.6 + (1 - sp) * 0.4, ctx.currentTime, 0.1)
    highGain.gain.setTargetAtTime(0.4 + sp * 0.6,       ctx.currentTime, 0.1)

    prevXRef.current = cursorX
    prevYRef.current = cursorY
  }, [cursorX, cursorY])

  // ── Initialization — fires once on first user gesture ──────────────────────
  useEffect(() => {
    const handler = async () => {
      if (startedRef.current) return
      startedRef.current = true

      const ctx = new AudioContext()
      await ctx.resume()
      ctxRef.current = ctx

      // — Group gain nodes (Parameter 4 — speed controls low/high mix) —
      const lowGroup  = ctx.createGain()
      const midGroup  = ctx.createGain()
      const highGroup = ctx.createGain()
      lowGroup.gain.value  = 1.0
      midGroup.gain.value  = 1.0
      highGroup.gain.value = 0.4
      lowGroupRef.current  = lowGroup
      highGroupRef.current = highGroup

      // — Master gain (Parameter 3 — rotation controls volume) —
      const masterGain = ctx.createGain()
      masterGain.gain.value = 0.85
      masterGainRef.current = masterGain

      // — Filter (Parameter 1 — distance controls cutoff) —
      const filter = ctx.createBiquadFilter()
      filter.type          = "lowpass"
      filter.Q.value       = 0.8
      filter.frequency.value = 9000
      filterRef.current = filter

      // — Dry/wet split (Parameter 2 — angle controls reverb) —
      const dryGain = ctx.createGain()
      const wetGain = ctx.createGain()
      dryGain.gain.value = 1
      wetGain.gain.value = 0
      dryGainRef.current = dryGain
      wetGainRef.current = wetGain

      const convolver = ctx.createConvolver()
      convolver.buffer = createSyntheticIR(ctx)

      // — Wire the chain —
      // Groups → master → filter → dry path + wet path → destination
      lowGroup.connect(masterGain)
      midGroup.connect(masterGain)
      highGroup.connect(masterGain)
      masterGain.connect(filter)
      filter.connect(dryGain)
      filter.connect(wetGain)
      dryGain.connect(ctx.destination)
      wetGain.connect(convolver)
      convolver.connect(ctx.destination)

      // — Load and start all three stem groups —
      const groups = [
        { name: "low",  count: 12, group: lowGroup,  xfade: 25 },
        { name: "mid",  count: 12, group: midGroup,  xfade: 30 },
        { name: "high", count: 12, group: highGroup, xfade: 20 },
      ]

      // Test file fallbacks — used when production stems aren't present yet
      const TEST_FALLBACKS = ["/audio/test1.mp3", "/audio/test2.mp3", "/audio/test3.mp3"]

      for (const { name, count, group, xfade } of groups) {
        const paths = Array.from({ length: count }, (_, i) =>
          `/audio/${name}-${String(i + 1).padStart(2, "0")}.mp3`
        )

        const buffers: AudioBuffer[] = []
        for (const path of paths) {
          const buf = await loadBuffer(ctx, path)
          if (buf) buffers.push(buf)
        }

        // Fall back to test files if no production stems found
        if (buffers.length === 0) {
          for (const path of TEST_FALLBACKS) {
            const buf = await loadBuffer(ctx, path)
            if (buf) buffers.push(buf)
          }
        }

        if (buffers.length === 0) continue

        startGroup(ctx, fisherYates(buffers), group, xfade)
      }
    }

    window.addEventListener("rma-audio-start", handler)
    return () => window.removeEventListener("rma-audio-start", handler)
  }, [])

  return null
}
