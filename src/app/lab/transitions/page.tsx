"use client";

import { useTransitionController, useNavigateWithTransition } from "@/components/motion/transitions";
import type { TransitionVariant } from "@/components/motion/transitions";
import styles from "./transitions.module.css";

const VARIANTS: { value: TransitionVariant; label: string }[] = [
  { value: "triple", label: "Triple Swoosh" },
  { value: "simple", label: "Simple" },
  { value: "duo", label: "Duo Move" },
  { value: "content", label: "Content Move" },
];

export default function TransitionsPage() {
  const { setVariant } = useTransitionController();
  const { navigateWithTransition } = useNavigateWithTransition();

  return (
    <main className={styles.page}>
      <a href="/lab" className={styles.backLink}>
        ← Lab
      </a>

      <h1 className={styles.title}>Transitions</h1>

      <div className={styles.variantSelect}>
        <label htmlFor="variant" className={styles.label}>
          Effect:
        </label>
        <select
          id="variant"
          className={styles.select}
          onChange={(e) => setVariant(e.target.value as TransitionVariant)}
          defaultValue="triple"
        >
          {VARIANTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navBtnA}`}
          onClick={() => navigateWithTransition("/lab/transitions/a")}
        >
          Go to A
        </button>
        <button
          type="button"
          className={`${styles.navBtn} ${styles.navBtnB}`}
          onClick={() => navigateWithTransition("/lab/transitions/b")}
        >
          Go to B
        </button>
      </div>
    </main>
  );
}
