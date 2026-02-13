"use client";

import { useState } from "react";
import Link from "next/link";
import { GrainTurbulenceOverlay } from "@/components/motion/grain/GrainTurbulenceOverlay";
import styles from "../grain.module.css";

const BLEND_MODES = [
  { value: "soft-light", label: "Soft Light" },
  { value: "overlay", label: "Overlay" },
  { value: "multiply", label: "Multiply" },
] as const;

const FREQUENCY_PRESETS = [
  { value: "low", label: "Low" },
  { value: "med", label: "Med" },
  { value: "high", label: "High" },
] as const;

export default function GrainTurbulencePage() {
  const [opacity, setOpacity] = useState(0.04);
  const [blendMode, setBlendMode] = useState<
    "soft-light" | "overlay" | "multiply"
  >("soft-light");
  const [intensity, setIntensity] = useState<"low" | "med" | "high">("med");
  const [animate, setAnimate] = useState(true);

  return (
    <main className={styles.page}>
      <Link href="/lab" className={styles.backLink}>
        ← Lab
      </Link>

      <h1 className={styles.title}>Grain (SVG feTurbulence)</h1>
      <p className={styles.description}>
        BYLD-style subtle animated grain overlay using SVG feTurbulence. No
        canvas, no external assets.
      </p>

      <section className={styles.hero}>
        <GrainTurbulenceOverlay
          opacity={opacity}
          blendMode={blendMode}
          frequencyPreset={intensity}
          animate={animate}
        />
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>Creative Manual</h2>
        </div>
      </section>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label htmlFor="opacity" className={styles.controlLabel}>
            Opacity (0.00–0.20)
          </label>
          <input
            id="opacity"
            type="range"
            min="0"
            max="0.2"
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className={styles.controlInput}
          />
          <span className={styles.controlLabel}>{opacity.toFixed(2)}</span>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="blend" className={styles.controlLabel}>
            Blend Mode
          </label>
          <select
            id="blend"
            value={blendMode}
            onChange={(e) =>
              setBlendMode(e.target.value as (typeof BLEND_MODES)[number]["value"])
            }
            className={styles.controlSelect}
          >
            {BLEND_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="intensity" className={styles.controlLabel}>
            Intensity (baseFrequency)
          </label>
          <select
            id="intensity"
            value={intensity}
            onChange={(e) =>
              setIntensity(e.target.value as (typeof FREQUENCY_PRESETS)[number]["value"])
            }
            className={styles.controlSelect}
          >
            {FREQUENCY_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.controlGroup}>
          <label htmlFor="animate" className={styles.controlLabel}>
            Animate
          </label>
          <label
            htmlFor="animate"
            className={styles.controlLabel}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}
          >
            <input
              id="animate"
              type="checkbox"
              checked={animate}
              onChange={(e) => setAnimate(e.target.checked)}
            />
            {animate ? "On" : "Off"}
          </label>
        </div>
      </div>
    </main>
  );
}
