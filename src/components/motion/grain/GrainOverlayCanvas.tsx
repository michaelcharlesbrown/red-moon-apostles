"use client";

import { useRef, useEffect } from "react";

interface GrainOverlayCanvasProps {
  opacity?: number;
  scale?: number;
  fps?: number;
  blendMode?: "overlay" | "soft-light" | "multiply" | "normal";
}

const MAX_DPR = 2;

export function GrainOverlayCanvas({
  opacity = 0.08,
  scale = 0.2,
  fps = 24,
  blendMode = "overlay",
}: GrainOverlayCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(MAX_DPR, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

    let offscreen = offscreenRef.current;
    if (!offscreen) {
      offscreen = document.createElement("canvas");
      offscreen.width = 160;
      offscreen.height = 90;
      offscreenRef.current = offscreen;
    }
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.ceil(rect.width * dpr);
      const h = Math.ceil(rect.height * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    const drawNoise = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const s = Math.max(0.01, Math.min(1, scale));
      const w = Math.min(800, Math.max(40, Math.round(160 / s)));
      const h = Math.min(450, Math.max(23, Math.round(90 / s)));
      offscreen.width = w;
      offscreen.height = h;

      const imgData = offCtx.createImageData(w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.floor(Math.random() * 256);
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      offCtx.putImageData(imgData, 0, 0);

      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation =
        blendMode === "normal" ? "source-over" : blendMode;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        offscreen,
        0,
        0,
        w,
        h,
        0,
        0,
        Math.ceil(rect.width * dpr),
        Math.ceil(rect.height * dpr)
      );
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    resize();
    window.addEventListener("resize", resize);

    if (prefersReducedMotion) {
      drawNoise();
      return () => {
        window.removeEventListener("resize", resize);
      };
    }

    const frameInterval = 1000 / fps;

    const loop = (now: number) => {
      if (now - lastFrameRef.current >= frameInterval) {
        lastFrameRef.current = now;
        drawNoise();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener("resize", resize);
    };
  }, [opacity, scale, fps, blendMode, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0 }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
        aria-hidden
      />
    </div>
  );
}
