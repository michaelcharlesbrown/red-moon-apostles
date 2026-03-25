"use client"

import { useEffect, useRef } from "react"

export default function GrainOverlay() {
  const seedRef = useRef(0)
  const turbRef = useRef<SVGAnimateElement | null>(null)

  useEffect(() => {
    // Animate the seed attribute to create flickering grain
    const turb = document.getElementById("rma-grain-turb") as SVGFETurbulenceElement | null
    if (!turb) return

    let raf = 0
    let lastUpdate = 0

    const animate = (timestamp: number) => {
      // Update seed ~12 times per second for film grain flicker
      if (timestamp - lastUpdate > 83) {
        seedRef.current = (seedRef.current + 1) % 100
        turb.setAttribute("seed", String(seedRef.current))
        lastUpdate = timestamp
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="rma-grain-filter" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence
              id="rma-grain-turb"
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves={3}
              seed={0}
              stitchTiles="stitch"
              result="grain"
            />
            <feColorMatrix
              in="grain"
              type="saturate"
              values="0"
              result="mono"
            />
            <feComponentTransfer in="mono" result="shaped">
              <feFuncR type="linear" slope="0.4" intercept="-0.08" />
              <feFuncG type="linear" slope="0.15" intercept="-0.03" />
              <feFuncB type="linear" slope="0.12" intercept="-0.03" />
              <feFuncA type="linear" slope="0.25" intercept="0" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10,
          pointerEvents: "none",
          filter: "url(#rma-grain-filter)",
          background: "transparent",
          mixBlendMode: "screen",
          opacity: 0.6,
        }}
      />
    </>
  )
}
