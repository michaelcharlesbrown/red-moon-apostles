"use client";

import Link from "next/link";
import { TypeDemo } from "@/components/motion/typography";
import styles from "./typography.module.css";

const demos = [
  {
    title: "Line Reveal",
    description: "Lines animate up with opacity, staggered.",
    mode: "lineReveal" as const,
    text: "The quick brown fox jumps over the lazy dog. Each line reveals in sequence.",
  },
  {
    title: "Char Cascade",
    description: "Characters cascade in with slight x drift and stagger.",
    mode: "charCascade" as const,
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    title: "Word Lift",
    description: "Words lift from below with opacity fade.",
    mode: "wordLift" as const,
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    title: "Scramble",
    description: "Characters scramble before settling to final text.",
    mode: "scramble" as const,
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    title: "Typewriter",
    description: "Text reveals as if being typed, with blinking caret.",
    mode: "typewriter" as const,
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    title: "Emphasis",
    description: "One keyword scales and pulses with letter-spacing.",
    mode: "emphasis" as const,
    text: "The quick brown fox jumps over the lazy dog.",
    keyword: "quick",
  },
];

export default function TypographyPage() {
  return (
    <main className={styles.page}>
      <a href="/lab" className={styles.backLink}>
        ← Lab
      </a>

      <header className={styles.hero}>
        <h1 className={styles.heroWord}>TYPOGRAPHY</h1>
        <p className={styles.heroSub}>GSAP Motion Patterns</p>
      </header>

      <div className={styles.demos}>
        {demos.map((demo) => (
          <TypeDemo
            key={demo.mode}
            title={demo.title}
            description={demo.description}
            mode={demo.mode}
            text={demo.text}
            keyword={"keyword" in demo ? demo.keyword : undefined}
          />
        ))}
      </div>
    </main>
  );
}
