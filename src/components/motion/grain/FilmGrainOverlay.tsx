"use client";

import { useMemo } from "react";

interface FilmGrainOverlayProps {
  opacity?: number;
  size?: number;
  blendMode?: "soft-light" | "overlay" | "multiply" | "normal";
  pulse?: boolean;
}

export function FilmGrainOverlay({
  opacity = 0.06,
  size = 280,
  blendMode = "soft-light",
  pulse = true,
}: FilmGrainOverlayProps) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const shouldPulse = pulse && !prefersReducedMotion;

  const style = useMemo(
    () => ({
      position: "absolute" as const,
      inset: 0,
      backgroundImage: "url('/textures/grain.png')",
      backgroundRepeat: "repeat",
      backgroundSize: `${size}px`,
      mixBlendMode: blendMode as React.CSSProperties["mixBlendMode"],
      opacity,
      pointerEvents: "none" as const,
      animation: shouldPulse ? "grain-pulse 4s ease-in-out infinite" : undefined,
    }),
    [opacity, size, blendMode, shouldPulse]
  );

  return (
    <>
      {shouldPulse && (
        <style>{`
          @keyframes grain-pulse {
            0%, 100% { opacity: ${opacity * 0.75}; }
            50% { opacity: ${opacity * 1.15}; }
          }
        `}</style>
      )}
      <div
        aria-hidden
        style={style}
      />
    </>
  );
}
