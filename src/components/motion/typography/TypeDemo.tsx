"use client";

import gsap from "gsap";
import { useRef, useEffect, useCallback } from "react";
import { splitToWords, splitToChars, groupWordsIntoLines } from "./SplitText";
import styles from "./TypeDemo.module.css";

export type TypeDemoMode =
  | "lineReveal"
  | "charCascade"
  | "wordLift"
  | "scramble"
  | "typewriter"
  | "emphasis";

interface TypeDemoProps {
  title: string;
  description: string;
  mode: TypeDemoMode;
  text: string;
  keyword?: string;
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function TypeDemo({ title, description, mode, text, keyword }: TypeDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLParagraphElement>(null);
  const typewriterWrapRef = useRef<HTMLDivElement>(null);
  const scrambleRafRef = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const resetPreview = useCallback(() => {
    if (!previewRef.current) return;
    previewRef.current.textContent = text;
  }, [text]);

  const runAnimation = useCallback(() => {
    if (!previewRef.current || !containerRef.current) return;

    resetPreview();
    const preview = previewRef.current;
    const container = containerRef.current;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      switch (mode) {
        case "lineReveal": {
          splitToWords(preview);
          const lines = groupWordsIntoLines(container);
          lines.forEach((lineEls, i) => {
            gsap.fromTo(
              lineEls,
              { yPercent: 110, opacity: 0 },
              {
                yPercent: 0,
                opacity: 1,
                duration: 0.5,
                ease: "power3.out",
                delay: i * 0.12,
              }
            );
          });
          break;
        }

        case "charCascade": {
          splitToChars(preview);
          const chars = preview.querySelectorAll("[data-char]");
          gsap.fromTo(
            chars,
            {
              yPercent: 80,
              opacity: 0,
              x: () => (Math.random() - 0.5) * 8,
            },
            {
              yPercent: 0,
              opacity: 1,
              x: 0,
              duration: 0.5,
              stagger: 0.015,
              ease: "power3.out",
            }
          );
          break;
        }

        case "wordLift": {
          splitToWords(preview);
          const words = preview.querySelectorAll("[data-word]");
          gsap.fromTo(
            words,
            { y: 16, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.45,
              stagger: 0.05,
              ease: "power3.out",
            }
          );
          break;
        }

        case "scramble": {
          splitToChars(preview);
          const chars = preview.querySelectorAll<HTMLElement>("[data-char]");
          const finalTexts = Array.from(chars).map((el) => el.textContent ?? "");
          const duration = 600;
          const start = performance.now();

          const tick = () => {
            const elapsed = performance.now() - start;
            const progress = Math.min(elapsed / duration, 1);

            chars.forEach((el, i) => {
              if (progress < 1) {
                el.textContent =
                  GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              } else {
                el.textContent = finalTexts[i];
              }
            });

            if (progress < 1) {
              scrambleRafRef.current = requestAnimationFrame(tick);
            }
          };
          scrambleRafRef.current = requestAnimationFrame(tick);
          break;
        }

        case "typewriter": {
          const clipEl = typewriterWrapRef.current ?? preview;
          gsap.fromTo(
            clipEl,
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0 0 0)",
              duration: 2,
              ease: "steps(40)",
            }
          );
          break;
        }

        case "emphasis": {
          if (!keyword || !text.includes(keyword)) {
            break;
          }
          const parts = text.split(keyword);
          preview.textContent = "";
          if (parts[0]) {
            preview.appendChild(document.createTextNode(parts[0]));
          }
          const span = document.createElement("span");
          span.setAttribute("data-emphasis", "");
          span.textContent = keyword;
          preview.appendChild(span);
          if (parts[1]) {
            preview.appendChild(document.createTextNode(parts[1]));
          }

          const emph = preview.querySelector("[data-emphasis]");
          if (emph) {
            gsap.fromTo(
              emph,
              { scale: 0.98, letterSpacing: "-0.02em" },
              {
                scale: 1.02,
                letterSpacing: "0.08em",
                duration: 0.3,
                ease: "power2.out",
              }
            );
            gsap.to(emph, {
              scale: 1,
              letterSpacing: "0.04em",
              duration: 0.4,
              delay: 0.3,
              ease: "power2.inOut",
            });
          }
          break;
        }
      }
    }, container);

    return () => {
      if (scrambleRafRef.current !== null) {
        cancelAnimationFrame(scrambleRafRef.current);
        scrambleRafRef.current = null;
      }
      ctx.revert();
    };
  }, [mode, text, keyword, prefersReducedMotion, resetPreview]);

  useEffect(() => {
    const cleanup = runAnimation();
    return () => {
      if (scrambleRafRef.current !== null) {
        cancelAnimationFrame(scrambleRafRef.current);
        scrambleRafRef.current = null;
      }
      cleanup?.();
    };
  }, [runAnimation]);

  const handleReplay = () => {
    if (scrambleRafRef.current !== null) {
      cancelAnimationFrame(scrambleRafRef.current);
      scrambleRafRef.current = null;
    }
    if (!containerRef.current) return;
    gsap.killTweensOf(containerRef.current.querySelectorAll("*"));
    if (typewriterWrapRef.current) {
      gsap.killTweensOf(typewriterWrapRef.current);
    }
    resetPreview();
    requestAnimationFrame(() => runAnimation());
  };

  return (
    <section ref={containerRef} className={styles.section}>
      <div className={styles.label}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>
      <div
        ref={mode === "typewriter" ? typewriterWrapRef : undefined}
        className={styles.previewWrap}
      >
        <p ref={previewRef} className={styles.preview}>
          {text}
        </p>
        {mode === "typewriter" && !prefersReducedMotion && (
          <span className={styles.caret} aria-hidden />
        )}
      </div>
      <button
        type="button"
        onClick={handleReplay}
        className={styles.replayBtn}
        aria-label={`Replay ${title} animation`}
      >
        Replay
      </button>
    </section>
  );
}
