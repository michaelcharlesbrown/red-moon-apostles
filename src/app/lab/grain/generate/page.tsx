"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import styles from "../grain.module.css";

function tileableBoxBlur(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  radius: number
): void {
  const radiusF = Math.floor(radius);
  if (radiusF <= 0) return;

  const mod = (a: number, b: number) => ((a % b) + b) % b;
  const idx = (x: number, y: number) => (mod(y, h) * w + mod(x, w)) * 4;

  const temp = new Uint8ClampedArray(data.length);
  temp.set(data);

  const area = (2 * radiusF + 1) ** 2;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = -radiusF; dy <= radiusF; dy++) {
        for (let dx = -radiusF; dx <= radiusF; dx++) {
          const i = idx(x + dx, y + dy);
          sum += temp[i];
        }
      }
      const i = (y * w + x) * 4;
      const v = Math.round(sum / area);
      data[i] = data[i + 1] = data[i + 2] = v;
    }
  }
}

function applyContrast(data: Uint8ClampedArray, contrast: number): void {
  const center = 128;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i];
    const out = Math.round(center + (v - center) * contrast);
    const clamped = Math.max(0, Math.min(255, out));
    data[i] = data[i + 1] = data[i + 2] = clamped;
  }
}

function generateTileableGrain(
  ctx: CanvasRenderingContext2D,
  size: number,
  amount: number,
  blur: number,
  contrast: number
): void {
  const w = size;
  const h = size;

  const canvas = ctx.canvas;
  canvas.width = w;
  canvas.height = h;

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // High-frequency noise (tileable via modulo sampling)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const v = Math.floor(Math.random() * 256);
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }

  // Low-frequency variation (tileable)
  const lowRes = 32;
  const lowData = new Uint8ClampedArray(lowRes * lowRes);
  for (let i = 0; i < lowData.length; i++) {
    lowData[i] = Math.floor(Math.random() * 256);
  }

  const mod = (a: number, b: number) => ((a % b) + b) % b;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lx = mod(Math.floor((x / w) * lowRes), lowRes);
      const ly = mod(Math.floor((y / h) * lowRes), lowRes);
      const lowV = lowData[ly * lowRes + lx];
      const i = (y * w + x) * 4;
      const blend = 0.15;
      const mixed = data[i] * (1 - blend) + lowV * blend;
      data[i] = data[i + 1] = data[i + 2] = Math.round(mixed);
    }
  }

  // Blur (tileable)
  const blurPx = blur * size * 0.02;
  if (blurPx > 0.5) {
    tileableBoxBlur(data, w, h, blurPx);
  }

  // Contrast
  applyContrast(data, contrast);

  // Amount: scale grain intensity (deviation from mid-gray)
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i];
    const dev = (v - 128) * amount;
    const out = 128 + dev;
    const clamped = Math.max(0, Math.min(255, Math.round(out)));
    data[i] = data[i + 1] = data[i + 2] = clamped;
  }

  ctx.putImageData(imgData, 0, 0);
}

export default function GenerateGrainPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<256 | 512>(256);
  const [amount, setAmount] = useState(0.8);
  const [blur, setBlur] = useState(0.5);
  const [contrast, setContrast] = useState(0.9);

  const handleGenerate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    generateTileableGrain(ctx, size, amount, blur, contrast);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "grain.png";
        a.click();
        URL.revokeObjectURL(url);
      },
      "image/png",
      1
    );
  };

  return (
    <main className={styles.page}>
      <Link href="/lab/grain" className={styles.backLink}>
        ← Grain
      </Link>

      <h1 className={styles.title}>Generate Film Grain Tile</h1>
      <p className={styles.description}>
        Create a seamless, tileable grain texture. Generate a preview, then
        download and save to public/textures/grain.png.
      </p>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Size</span>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="size"
                checked={size === 256}
                onChange={() => setSize(256)}
              />
              256
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="size"
                checked={size === 512}
                onChange={() => setSize(512)}
              />
              512
            </label>
          </div>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="amount" className={styles.controlLabel}>
            Amount (0.4–1.2)
          </label>
          <input
            id="amount"
            type="range"
            min="0.4"
            max="1.2"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            className={styles.controlInput}
          />
          <span className={styles.controlLabel}>{amount.toFixed(2)}</span>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="blur" className={styles.controlLabel}>
            Blur (0–1.5)
          </label>
          <input
            id="blur"
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={blur}
            onChange={(e) => setBlur(parseFloat(e.target.value))}
            className={styles.controlInput}
          />
          <span className={styles.controlLabel}>{blur.toFixed(2)}</span>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="contrast" className={styles.controlLabel}>
            Contrast (0.6–1.2)
          </label>
          <input
            id="contrast"
            type="range"
            min="0.6"
            max="1.2"
            step="0.01"
            value={contrast}
            onChange={(e) => setContrast(parseFloat(e.target.value))}
            className={styles.controlInput}
          />
          <span className={styles.controlLabel}>{contrast.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={handleGenerate}
          className={styles.controlInput}
          style={{ cursor: "pointer", maxWidth: "200px" }}
        >
          Generate Preview
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className={styles.controlInput}
          style={{ cursor: "pointer", maxWidth: "200px" }}
        >
          Download PNG
        </button>
      </div>

      <div
        style={{
          background: "#111",
          borderRadius: 8,
          padding: "1rem",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          style={{
            width: "100%",
            maxWidth: 400,
            height: "auto",
            display: "block",
            imageRendering: "pixelated",
          }}
        />
      </div>
    </main>
  );
}
