"use client";

import { useRef, useEffect, useId } from "react";

const FREQUENCY_PRESETS: Record<string, string> = {
  low: "0.4",
  med: "0.8",
  high: "1.2",
};

interface GrainTurbulenceOverlayProps {
  opacity?: number;
  blendMode?: "soft-light" | "overlay" | "multiply";
  frequencyPreset?: "low" | "med" | "high";
  animate?: boolean;
}

export function GrainTurbulenceOverlay({
  opacity = 0.04,
  blendMode = "soft-light",
  frequencyPreset = "med",
  animate = true,
}: GrainTurbulenceOverlayProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filterId = `grain-${useId().replace(/:/g, "-")}`;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shouldAnimate = animate && !prefersReducedMotion;
  const baseFreq = FREQUENCY_PRESETS[frequencyPreset] ?? FREQUENCY_PRESETS.med;

  useEffect(() => {
    const feTurbulence = svgRef.current?.querySelector("feTurbulence");
    if (!feTurbulence || !shouldAnimate) return;

    intervalRef.current = setInterval(() => {
      feTurbulence.setAttribute("seed", String(Math.floor(Math.random() * 100)));
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shouldAnimate]);

  return (
    <svg
      ref={svgRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        mixBlendMode: blendMode,
        opacity,
      }}
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={baseFreq}
            numOctaves="3"
            stitchTiles="stitch"
            seed="1"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${filterId})`}
        fill="white"
        fillOpacity="1"
      />
    </svg>
  );
}
