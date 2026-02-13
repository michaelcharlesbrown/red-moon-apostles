"use client";

import gsap from "gsap";
import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import styles from "./RapidLayersTransition.module.css";

export interface RapidLayersTransitionHandle {
  play: () => Promise<void>;
}

const LAYER_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80",
  "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1920&q=80",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&q=80",
];

export const RapidLayersTransition = forwardRef<
  RapidLayersTransitionHandle,
  { onComplete?: () => void }
>(function RapidLayersTransition({ onComplete }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useImperativeHandle(ref, () => ({
    play: () => {
      return new Promise<void>((resolve) => {
        const container = containerRef.current;
        if (!container) {
          resolve();
          return;
        }

        const wrapEls = container.querySelectorAll<HTMLElement>(`.${styles.layerWrap}`);
        const imgEls = container.querySelectorAll<HTMLElement>(`.${styles.layerImg}`);

        container.style.visibility = "visible";

        if (prefersReducedMotion) {
          gsap.set(wrapEls, { yPercent: 0 });
          gsap.set(imgEls, { yPercent: 0 });
          container.style.pointerEvents = "none";
          container.style.visibility = "hidden";
          onComplete?.();
          resolve();
          return;
        }

        container.style.pointerEvents = "auto";
        gsap.set(wrapEls, { yPercent: 101 });
        gsap.set(imgEls, { yPercent: -101 });

        const ctx = gsap.context(() => {
          const duration = 1;
          const panelDelay = 0.15;
          const tl = gsap.timeline({
            onComplete: () => {
              container.style.pointerEvents = "none";
              container.style.visibility = "hidden";
              onComplete?.();
              resolve();
            },
          });

          for (let i = 0; i < wrapEls.length; i++) {
            tl.to(
              [wrapEls[i], imgEls[i]],
              {
                yPercent: 0,
                duration,
                ease: "power2.inOut",
              },
              panelDelay * i
            );
          }
        }, container);

        return () => ctx.revert();
      });
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wrapEls = container.querySelectorAll<HTMLElement>(`.${styles.layerWrap}`);
    const imgEls = container.querySelectorAll<HTMLElement>(`.${styles.layerImg}`);

    const ctx = gsap.context(() => {
      gsap.set(wrapEls, { yPercent: 101 });
      gsap.set(imgEls, { yPercent: -101 });
    }, container);

    return () => {
      gsap.killTweensOf(container.querySelectorAll("*"));
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={styles.overlay}
      style={{ pointerEvents: "none", visibility: "hidden" }}
      aria-hidden
    >
      {LAYER_IMAGES.map((url, i) => (
        <div key={i} className={styles.layerWrap}>
          <div
            className={styles.layerImg}
            style={{
              backgroundImage: `url(${url})`,
            }}
          />
        </div>
      ))}
    </div>
  );
});
