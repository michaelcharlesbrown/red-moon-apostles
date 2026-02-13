"use client";

import { useRef } from "react";
import Link from "next/link";
import { RapidLayersTransition } from "@/components/motion/transitions";
import type { RapidLayersTransitionHandle } from "@/components/motion/transitions";
import styles from "./rapid-layers.module.css";

export default function RapidLayersPage() {
  const transitionRef = useRef<RapidLayersTransitionHandle>(null);

  return (
    <main className={styles.page}>
      <Link href="/lab/transitions" className={styles.backLink}>
        ← Transitions
      </Link>

      <button
        type="button"
        className={styles.playBtn}
        onClick={() => transitionRef.current?.play()}
      >
        Play Transition
      </button>

      <RapidLayersTransition ref={transitionRef} />
    </main>
  );
}
