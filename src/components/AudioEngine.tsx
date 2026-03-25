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

// Play a shuffled playlist with crossfades — runs independently per group.
// entryDelay: seconds before the first stem starts (staggers groups for gradual build).
// entryFade:  seconds for the first stem to fade in on entry.
function startGroup(
  ctx: AudioContext,
  playlist: AudioBuffer[],
  groupGain: GainNode,
  xfadeDuration: number,
  entryDelay: number,
  entryFade: number
) {
  let index        = 0
  let firstEntry   = true
  let activeSrc:  AudioBufferSourceNode | null = null
  let activeGain: GainNode              | null = null

  const playNext = () => {
    if (ctx.state === "closed") return

    const buffer = playlist[index % playlist.length]
    index++

    const src  = ctx.createBufferSource()
    src.buffer = buffer
    // Loop at buffer boundary — seamless if crossfade timing ever drifts
    src.loop      = true
    src.loopStart = 0
    src.loopEnd   = buffer.duration

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, ctx.currentTime)

    // First entry: slow soft fade-in so each layer grows into the world.
    // Subsequent crossfades: normal half-xfade ramp.
    const fadeIn = firstEntry
      ? entryFade
      : Math.min(xfadeDuration * 0.5, buffer.duration * 0.25)
    firstEntry = false

    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeIn)

    src.connect(gain)
    gain.connect(groupGain)
    src.start(ctx.currentTime, 0) // always from the top

    // Fade out and clean up the outgoing stem
    if (activeGain && activeSrc) {
      const old = { src: activeSrc, gain: activeGain }
      old.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + xfadeDuration)
      setTimeout(() => {
        try { old.src.stop()        } catch { /* already stopped */ }
        try { old.gain.disconnect() } catch { /* already disconnected */ }
      }, (xfadeDuration + 1) * 1000)
    }

    activeSrc  = src
    activeGain = gain

    // Schedule next crossfade when this stem nears its loop point
    const msUntilCrossfade = Math.max(500, (buffer.duration - xfadeDuration) * 1000)
    setTimeout(playNext, msUntilCrossfade)
  }

  // Stagger entry — low comes in first, then mid, then high
  setTimeout(playNext, entryDelay * 1000)
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
  const audioStartRef   = useRef(0)   // ctx.currentTime when audio was initialised

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

    // Resume if the browser suspended the context (tab switch, focus loss, etc.)
    if (ctx.state === "suspended") ctx.resume()

    const sunCx = window.innerWidth  * 0.5
    const sunCy = window.innerHeight * 0.38

    const dx = cursorX - sunCx
    const dy = cursorY - sunCy

    // — Parameter 1: Vertical position → Filter cutoff —
    // Full screen top-to-bottom: top = bright/open (9000 Hz), bottom = dark/closed (300 Hz).
    // Much more gradual than center-to-edge — the whole screen is the instrument.
    const normY    = 1 - (cursorY / window.innerHeight)   // 0 = bottom, 1 = top
    const targetHz = 300 + normY * 8700

    // On first entry the cursor snaps from wherever it is to 300–9000 Hz instantly.
    // Use a long ramp that shortens over the first 8 seconds so the filter drifts
    // into position instead of slamming there.
    const timeSinceStart = ctx.currentTime - audioStartRef.current
    const rampTime = timeSinceStart < 8
      ? 0.25 + Math.max(0, (8 - timeSinceStart) * 0.35)   // 3.05 s → 0.25 s over 8 s
      : 0.25
    filter.frequency.cancelScheduledValues(0)
    filter.frequency.linearRampToValueAtTime(targetHz, ctx.currentTime + rampTime)

    // — Parameter 2: Angle → Reverb wet/dry —
    const angle     = Math.atan2(dy, dx)
    const normAngle = (angle + Math.PI) / (Math.PI * 2) // 0=top-right, 0.5=bottom, 1=top-right
    const wetLevel  = normAngle * 0.55              // cap at 0.55 — reverb never fully swamps signal
    wetGain.gain.setTargetAtTime(wetLevel,        ctx.currentTime, 0.05)
    dryGain.gain.setTargetAtTime(1 - wetLevel,    ctx.currentTime, 0.05)

    // — Parameter 3: Rotation speed → Master volume —
    // Guard against stale prevAngle after cursor re-entry: large position jumps
    // produce a huge rawDelta that would spike rotAcc and kill volume.
    const posJump = Math.hypot(cursorX - prevXRef.current, cursorY - prevYRef.current)
    if (posJump < 80) {
      const rawDelta  = angle - prevAngleRef.current
      const normDelta = ((rawDelta + Math.PI) % (Math.PI * 2)) - Math.PI
      rotAccRef.current += normDelta * 0.3
      rotAccRef.current *= 0.88                     // faster decay — spikes dissipate in ~8 frames
      masterVolRef.current = Math.max(0.0, Math.min(1.0,
        masterVolRef.current + rotAccRef.current * 0.01
      ))
    }
    // Slow gravity back toward 0.85 — cursor drifting without orbiting won't kill the volume
    masterVolRef.current = masterVolRef.current * 0.998 + 0.85 * 0.002
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
      ctx.resume()
      ctxRef.current = ctx
      audioStartRef.current = ctx.currentTime

      // iOS Safari unlock: play a silent 1-sample buffer immediately and synchronously.
      // CustomEvents don't carry iOS's user-gesture context, so the AudioContext
      // would otherwise stay suspended. This forces it permanently active before
      // any async loading begins.
      const unlock = ctx.createBufferSource()
      unlock.buffer = ctx.createBuffer(1, 1, 22050)
      unlock.connect(ctx.destination)
      unlock.start(0)

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
      filter.type            = "lowpass"
      filter.Q.value         = 0.8
      filter.frequency.value = 4500   // neutral mid — cursor will drift it from here
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
      // entryDelay staggers the layers: low enters immediately, mid at 30s, high at 60s.
      // entryFade is how long each group fades in on first entry.
      const groups = [
        { name: "low",  count: 12, group: lowGroup,  xfade: 25, entryDelay:  0, entryFade: 8  },
        { name: "mid",  count: 12, group: midGroup,  xfade: 30, entryDelay: 30, entryFade: 10 },
        { name: "high", count: 12, group: highGroup, xfade: 20, entryDelay: 60, entryFade: 12 },
      ]

      // Test file fallbacks — used when production stems aren't present yet
      const TEST_FALLBACKS = ["/audio/test1.mp3", "/audio/test2.mp3", "/audio/test3.mp3"]

      for (const { name, count, group, xfade, entryDelay, entryFade } of groups) {
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

        startGroup(ctx, fisherYates(buffers), group, xfade, entryDelay, entryFade)
      }
    }

    // Resume AudioContext when the page regains visibility after a tab switch
    const handleVisibility = () => {
      if (!document.hidden && ctxRef.current?.state === "suspended") {
        ctxRef.current.resume()
      }
    }

    window.addEventListener("rma-audio-start", handler)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("rma-audio-start", handler)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  return null
}
