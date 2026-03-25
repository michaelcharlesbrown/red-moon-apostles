"use client"

import { useEffect, useRef, useMemo, MutableRefObject } from "react"

interface CloudCanvasProps {
  scrollOffsetRef: MutableRefObject<number>
  mgIndex: number
}

export default function CloudCanvas({ scrollOffsetRef, mgIndex }: CloudCanvasProps) {
  const cloudRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)

  const seed = useMemo(() => mgIndex * 137 + 42, [mgIndex])

  // Parallax + drift + breathing RAF loop
  useEffect(() => {
    const cloudDiv = cloudRef.current
    if (!cloudDiv) return

    const animate = (timestamp: number) => {
      const driftX = Math.sin(timestamp * 0.000025) * 5 + Math.sin(timestamp * 0.000055) * 3 + Math.sin(timestamp * 0.00012) * 1.5
      const driftY = Math.cos(timestamp * 0.000018) * 3 + Math.cos(timestamp * 0.000045) * 2
      const parallaxY = scrollOffsetRef.current * 0.06
      const breathe = 1.0 + Math.sin(timestamp * Math.PI * 2 / 20000) * 0.04
      const breathe2 = 1.0 + Math.sin(timestamp * Math.PI * 2 / 35000 + 1.5) * 0.03

      cloudDiv.style.transform = `translate(${driftX}%, ${driftY}%) scale(${(breathe * breathe2).toFixed(4)}) translateY(${parallaxY}px)`

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Build feColorMatrix values strings
  const baseMatrix = [
    "1.2  0.8  0  0 -0.5",
    "0.08 0.05 0  0 -0.01",
    "0    0    0  0  0",
    "1.6  1.0  0  0 -1.1",
  ].join(" ")

  const highlightMatrix = [
    "2.0  0  0  0 -0.7",
    "0.18 0  0  0 -0.04",
    "0    0  0  0  0",
    "3.2  0  0  0 -2.2",
  ].join(" ")

  const shadowMatrix = [
    "0.3  0.2  0  0 -0.05",
    "0.02 0.01 0  0  0",
    "0    0    0  0  0",
    "2.0  1.2  0  0 -1.4",
  ].join(" ")

  return (
    <>
      {/* SVG filter defs — rendered inline so filter exists before cloud div */}
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
              values={baseMatrix}
              result="redBase"
            />
            <feGaussianBlur
              in="redBase"
              stdDeviation={2}
              result="softBase"
            />

            {/* Finer detail — bright highlights */}
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
              values={highlightMatrix}
              result="highlights"
            />
            <feGaussianBlur
              in="highlights"
              stdDeviation={1}
              result="softHighlights"
            />

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
              values={shadowMatrix}
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

      {/* Cloud layer — oversized so drift never reveals edges */}
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
          WebkitMaskImage:
            "linear-gradient(to bottom, white 0%, white 45%, transparent 65%)",
          maskImage:
            "linear-gradient(to bottom, white 0%, white 45%, transparent 65%)",
        }}
      />

    </>
  )
}
