"use client"

import { useEffect, useRef, useMemo, MutableRefObject } from "react"

interface CloudCanvasProps {
  scrollOffsetRef: MutableRefObject<number>
  cursorRef:       MutableRefObject<{ x: number; y: number }>
  mgIndex: number
}

export default function CloudCanvas({ scrollOffsetRef, cursorRef, mgIndex }: CloudCanvasProps) {
  const cloudRef    = useRef<HTMLDivElement>(null)
  const rafRef      = useRef(0)
  const readyRef    = useRef(false)

  const displayOp = useRef(1)   // opacity moves at constant rate — no snap, no lurch

  const seed = useMemo(() => mgIndex * 137 + 42, [mgIndex])

  useEffect(() => {
    const cloudDiv = cloudRef.current
    if (!cloudDiv) return

    const animate = (timestamp: number) => {
      // ── Drift / parallax / breathe ────────────────────────────────────────
      const driftX    = Math.sin(timestamp * 0.000025) * 5 + Math.sin(timestamp * 0.000055) * 3 + Math.sin(timestamp * 0.00012) * 1.5
      const driftY    = Math.cos(timestamp * 0.000018) * 3 + Math.cos(timestamp * 0.000045) * 2
      const parallaxY = scrollOffsetRef.current * 0.06
      const breathe   = 1.0 + Math.sin(timestamp * Math.PI * 2 / 20000) * 0.04
      const breathe2  = 1.0 + Math.sin(timestamp * Math.PI * 2 / 35000 + 1.5) * 0.03
      cloudDiv.style.transform = `translate(${driftX}%, ${driftY}%) scale(${(breathe * breathe2).toFixed(4)}) translateY(${parallaxY}px)`

      // ── Cloud opacity — cursor below sun fades clouds out ────────────────
      // Constant-rate step so the change is always gradual, never a snap.
      const dy     = cursorRef.current.y - window.innerHeight * 0.38
      const normV  = Math.max(-1, Math.min(1, dy / (window.innerHeight * 0.52)))
      const targetOp = 1.0 - Math.max(0, normV) * 0.82
      const diff   = targetOp - displayOp.current
      displayOp.current += Math.sign(diff) * Math.min(Math.abs(diff), 0.0025)
      cloudDiv.style.opacity = displayOp.current.toFixed(4)

      if (!readyRef.current) {
        readyRef.current = true
        window.dispatchEvent(new CustomEvent("rma-layer-ready", { detail: "cloud" }))
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", width: 0, height: 0 }}
      >
        <defs>
          <filter
            id="rma-clouds"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            {/* Base turbulence — large-scale cloud shapes */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004 0.003"
              numOctaves={6}
              seed={seed}
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="1.2 0.8 0 0 -0.5  0.08 0.05 0 0 -0.01  0 0 0 0 0  1.6 1.0 0 0 -1.1"
              result="redBase"
            />
            <feGaussianBlur in="redBase" stdDeviation={2} result="softBase" />

            {/* Finer detail — bright highlight pockets */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.007 0.005"
              numOctaves={4}
              seed={seed + 50}
              result="noise2"
            />
            <feColorMatrix
              in="noise2"
              type="matrix"
              values="2.0 0 0 0 -0.7  0.18 0 0 0 -0.04  0 0 0 0 0  3.2 0 0 0 -2.2"
              result="highlights"
            />
            <feGaussianBlur in="highlights" stdDeviation={1} result="softHighlights" />

            {/* Deep shadow veins */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.003 0.002"
              numOctaves={5}
              seed={seed + 100}
              result="noise3"
            />
            <feColorMatrix
              in="noise3"
              type="matrix"
              values="0.3 0.2 0 0 -0.05  0.02 0.01 0 0 0  0 0 0 0 0  2.0 1.2 0 0 -1.4"
              result="shadows"
            />

            {/* Merge: shadows → base → highlights */}
            <feMerge>
              <feMergeNode in="shadows" />
              <feMergeNode in="softBase" />
              <feMergeNode in="softHighlights" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div
        ref={cloudRef}
        style={{
          position: "fixed",
          top: "-20%",
          left: "-20%",
          width: "140%",
          height: "140%",
          zIndex: 2,
          pointerEvents: "none",
          background: "white",
          filter: "url(#rma-clouds)",
          WebkitMaskImage: "linear-gradient(to bottom, white 0%, white 45%, transparent 65%)",
          maskImage:       "linear-gradient(to bottom, white 0%, white 45%, transparent 65%)",
        }}
      />
    </>
  )
}
