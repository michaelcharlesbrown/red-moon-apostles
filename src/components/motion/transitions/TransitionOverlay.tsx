"use client";

import gsap from "gsap";
import { useRef, useEffect, useCallback } from "react";
import { useTransitionContext } from "./TransitionContext";
import type { TransitionVariant } from "./TransitionContext";
import styles from "./TransitionOverlay.module.css";

const LAYER_COLORS = ["#A855F7", "#EC4899", "#3B82F6"];

// Codrops PageRevealEffects timings (https://github.com/codrops/PageRevealEffects)
const TRIPLE_EASE = "cubic-bezier(0.55, 0.055, 0.675, 0.19)";
const SIMPLE_EASE = "cubic-bezier(0.2, 1, 0.3, 1)";
const DUO_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";
const CONTENT_EASE = "cubic-bezier(0.55, 0.055, 0.675, 0.19)";
const DURATION = 0.75;

export function TransitionOverlay() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const variantRef = useRef<TransitionVariant>("triple");
  const { register } = useTransitionContext();

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const playCover = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (prefersReducedMotion) {
        resolve();
        return;
      }
      const layers = layerRefs.current.filter(Boolean);
      const v = variantRef.current;

      const ctx = gsap.context(() => {
        if (v === "triple") {
          gsap.set(layers, { xPercent: -100 });
          const tl = gsap.timeline({ onComplete: () => resolve() });
          tl.to(layers[0], { xPercent: 0, duration: DURATION, ease: TRIPLE_EASE })
            .to(layers[1], { xPercent: 0, duration: DURATION, ease: TRIPLE_EASE }, "-=0.58")
            .to(layers[2], { xPercent: 0, duration: DURATION, ease: TRIPLE_EASE }, "-=0.58");
        } else if (v === "simple") {
          gsap.set(layers[0], { scaleX: 0 });
          gsap.set(layers[1], { scaleX: 0 });
          gsap.set(layers[2], { scaleX: 0 });
          gsap.to(layers, {
            scaleX: 1,
            duration: DURATION,
            ease: SIMPLE_EASE,
            stagger: 0.04,
            onComplete: () => resolve(),
          });
        } else if (v === "duo") {
          gsap.set(layers[0], { xPercent: -100 });
          gsap.set(layers[2], { xPercent: 100 });
          gsap.set(layers[1], { opacity: 0 });
          gsap.to([layers[0], layers[2]], {
            xPercent: 0,
            duration: DURATION,
            ease: DUO_EASE,
            onComplete: () => resolve(),
          });
        } else {
          gsap.set(layers, { yPercent: -100 });
          const tl = gsap.timeline({ onComplete: () => resolve() });
          tl.to(layers[0], { yPercent: 0, duration: DURATION, ease: CONTENT_EASE })
            .to(layers[1], { yPercent: 0, duration: DURATION, ease: CONTENT_EASE }, "-=0.6")
            .to(layers[2], { yPercent: 0, duration: DURATION, ease: CONTENT_EASE }, "-=0.6");
        }
      });

      return () => ctx.revert();
    });
  }, [prefersReducedMotion]);

  const resetLayers = useCallback(() => {
    const layers = layerRefs.current.filter(Boolean);
    const v = variantRef.current;
    if (v === "triple" || v === "duo") {
      gsap.set(layers[0], { xPercent: -100 });
      gsap.set(layers[1], { xPercent: -100 });
      gsap.set(layers[2], { xPercent: 100 });
    } else if (v === "simple") {
      gsap.set(layers, { scaleX: 0 });
    } else {
      gsap.set(layers, { yPercent: -100 });
    }
  }, []);

  const playReveal = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (prefersReducedMotion) {
        resolve();
        return;
      }
      const layers = layerRefs.current.filter(Boolean);
      const v = variantRef.current;

      const ctx = gsap.context(() => {
        const onDone = () => {
          resetLayers();
          resolve();
        };
        if (v === "triple") {
          const tl = gsap.timeline({ onComplete: onDone });
          tl.to(layers[0], { xPercent: 100, duration: DURATION, ease: TRIPLE_EASE })
            .to(layers[1], { xPercent: 100, duration: DURATION, ease: TRIPLE_EASE }, "-=0.58")
            .to(layers[2], { xPercent: 100, duration: DURATION, ease: TRIPLE_EASE }, "-=0.58");
        } else if (v === "simple") {
          gsap.to([...layers].reverse(), {
            scaleX: 0,
            duration: DURATION,
            ease: SIMPLE_EASE,
            stagger: 0.04,
            onComplete: onDone,
          });
        } else if (v === "duo") {
          gsap.to(layers[0], { xPercent: -100, duration: DURATION, ease: DUO_EASE });
          gsap.to(layers[2], { xPercent: 100, duration: DURATION, ease: DUO_EASE, onComplete: onDone });
        } else {
          const tl = gsap.timeline({ onComplete: onDone });
          tl.to(layers[0], { yPercent: -100, duration: DURATION, ease: CONTENT_EASE })
            .to(layers[1], { yPercent: -100, duration: DURATION, ease: CONTENT_EASE }, "-=0.6")
            .to(layers[2], { yPercent: -100, duration: DURATION, ease: CONTENT_EASE }, "-=0.6");
        }
      });

      return () => ctx.revert();
    });
  }, [prefersReducedMotion, resetLayers]);

  const setVariant = useCallback((v: TransitionVariant) => {
    variantRef.current = v;
  }, []);

  useEffect(() => {
    register({ playCover, playReveal, setVariant });
  }, [register, playCover, playReveal, setVariant]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(layerRefs.current[0], { xPercent: -100 });
      gsap.set(layerRefs.current[1], { xPercent: -100 });
      gsap.set(layerRefs.current[2], { xPercent: -100 });
    });

    return () => {
      gsap.killTweensOf(layerRefs.current.filter(Boolean));
      ctx.revert();
    };
  }, []);

  return (
    <div className={styles.overlay} aria-hidden>
      <div
        ref={(el) => { layerRefs.current[0] = el; }}
        className={styles.layer}
        style={{ backgroundColor: LAYER_COLORS[0], transformOrigin: "left center" }}
      />
      <div
        ref={(el) => { layerRefs.current[1] = el; }}
        className={styles.layer}
        style={{ backgroundColor: LAYER_COLORS[1], transformOrigin: "left center" }}
      />
      <div
        ref={(el) => { layerRefs.current[2] = el; }}
        className={styles.layer}
        style={{ backgroundColor: LAYER_COLORS[2], transformOrigin: "right center" }}
      />
    </div>
  );
}
