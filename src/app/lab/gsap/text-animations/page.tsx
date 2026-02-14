"use client";

import gsap from "gsap";
import Link from "next/link";
import SplitType from "split-type";
import { useRef, useEffect, useCallback, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Shared constants                                                   */
/* ------------------------------------------------------------------ */

const SAMPLE = "The quick brown fox jumps over the lazy dog.";
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&";

/* ------------------------------------------------------------------ */
/*  Reduced-motion helper                                              */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/*  Generic demo card                                                  */
/* ------------------------------------------------------------------ */

interface DemoCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onReplay: () => void;
}

function DemoCard({ title, description, children, onReplay }: DemoCardProps) {
  return (
    <section className="rounded-lg border border-[#2a2b2f] bg-[#18191c] p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#e5e5e5]">{title}</h2>
        <p className="mt-0.5 text-xs text-[#666]">{description}</p>
      </div>
      <div className="mb-4 min-h-[3.5rem] overflow-hidden text-[clamp(1rem,3vw,1.5rem)] leading-relaxed text-[#e5e5e5]">
        {children}
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="cursor-pointer border border-[#555] bg-transparent px-3 py-1.5 text-xs text-[#ccc] transition-colors hover:border-[#888] hover:text-white"
      >
        Replay
      </button>
    </section>
  );
}

/* ================================================================== */
/*  1. Character Fade + Slide Up                                       */
/* ================================================================== */

function CharFadeSlideUp({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    // Revert any previous split before re-splitting
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    gsap.fromTo(
      split.chars,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.02, ease: "power3.out" }
    );
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="1 · Character Fade + Slide Up"
      description="Each character fades in and slides up with staggered timing."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  2. Word-by-Word Elastic Bounce                                     */
/* ================================================================== */

function WordElasticBounce({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "words" });
    splitRef.current = split;
    if (!split.words) return;

    gsap.fromTo(
      split.words,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.06,
        ease: "elastic.out(1, 0.4)",
      }
    );
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="2 · Word Elastic Bounce"
      description="Words bounce in from below with elastic easing."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  3. Line-by-Line Wipe Reveal                                        */
/* ================================================================== */

function LineWipeReveal({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  const longText =
    "The quick brown fox jumps over the lazy dog. " +
    "Pack my box with five dozen liquor jugs.";

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "lines" });
    splitRef.current = split;
    if (!split.lines) return;

    // Wrap each line in a clip container for the wipe effect
    split.lines.forEach((line) => {
      const wrapper = document.createElement("div");
      wrapper.style.overflow = "hidden";
      line.parentNode?.insertBefore(wrapper, line);
      wrapper.appendChild(line);
    });

    gsap.fromTo(
      split.lines,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      }
    );
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = longText;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="3 · Line-by-Line Wipe Reveal"
      description="Each line slides up from behind a clipping mask."
      onReplay={replay}
    >
      <p ref={ref}>{longText}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  4. Scramble Effect                                                 */
/* ================================================================== */

function ScrambleEffect({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);
  const rafRef = useRef<number | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    const chars = split.chars;
    const finals = chars.map((el) => el.textContent ?? "");
    const duration = 800; // ms
    const start = performance.now();

    const tick = () => {
      const progress = Math.min((performance.now() - start) / duration, 1);
      chars.forEach((el, i) => {
        // Each character resolves at a staggered threshold
        const threshold = i / chars.length;
        if (progress > threshold) {
          // Probability of showing final increases as progress passes threshold
          const localProgress = (progress - threshold) / (1 - threshold);
          if (localProgress > 0.7 || progress === 1) {
            el.textContent = finals[i];
          } else {
            el.textContent =
              finals[i] === " "
                ? " "
                : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        } else {
          el.textContent =
            finals[i] === " "
              ? " "
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      });
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="4 · Scramble Effect"
      description="Characters cycle through random glyphs before resolving left-to-right."
      onReplay={replay}
    >
      <p ref={ref} style={{ fontFamily: "monospace" }}>
        {SAMPLE}
      </p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  5. Rotate + Scale Per Character                                    */
/* ================================================================== */

function RotateScaleChars({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    gsap.fromTo(
      split.chars,
      { scale: 0, rotation: -180, opacity: 0 },
      {
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.02,
        ease: "back.out(1.7)",
        transformOrigin: "50% 50%",
      }
    );
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="5 · Rotate + Scale Per Character"
      description="Each character spins in from zero scale with back easing."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  6. Blur In With Stagger                                            */
/* ================================================================== */

function BlurInStagger({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    gsap.fromTo(
      split.chars,
      { opacity: 0, filter: "blur(12px)" },
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.5,
        stagger: 0.02,
        ease: "power2.out",
      }
    );
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="6 · Blur In With Stagger"
      description="Characters emerge from a heavy gaussian blur."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  7. Perspective 3D Flip                                             */
/* ================================================================== */

function Perspective3DFlip({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    // Apply perspective to parent for 3D transforms
    gsap.set(ref.current, { perspective: 600 });

    gsap.fromTo(
      split.chars,
      { rotationX: -90, opacity: 0, transformOrigin: "50% 100%" },
      {
        rotationX: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.025,
        ease: "power3.out",
      }
    );
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="7 · Perspective 3D Flip"
      description="Characters flip in along the X-axis from below with perspective depth."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  8. Wave Motion                                                     */
/* ================================================================== */

function WaveMotion({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    tlRef.current?.kill();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    // Initial entrance
    gsap.fromTo(
      split.chars,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, stagger: 0.01 }
    );

    // Continuous sine-wave motion
    const tl = gsap.timeline({ repeat: -1, defaults: { ease: "none" } });
    tlRef.current = tl;

    split.chars.forEach((char, i) => {
      tl.to(
        char,
        {
          y: -12,
          duration: 0.3,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        i * 0.04 // staggered start in the timeline
      );
    });

    // Pad the timeline so the wave loops seamlessly
    tl.totalDuration(tl.duration() + 0.5);
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      tlRef.current?.kill();
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    tlRef.current?.kill();
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="8 · Wave Motion"
      description="A continuous sine-wave ripples across the characters."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  9. Elastic Overshoot on Hover                                      */
/* ================================================================== */

function ElasticHover({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  // Split once on mount so hover targets exist
  useEffect(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;

    return () => {
      splitRef.current?.revert();
    };
  }, [reduced]);

  const handleCharEnter = (e: React.MouseEvent<HTMLParagraphElement>) => {
    if (reduced) return;
    const target = e.target as HTMLElement;
    if (!target.classList.contains("char")) return;
    gsap.to(target, {
      y: -8,
      scale: 1.3,
      color: "#fff",
      duration: 0.4,
      ease: "elastic.out(1, 0.3)",
    });
  };

  const handleCharLeave = (e: React.MouseEvent<HTMLParagraphElement>) => {
    if (reduced) return;
    const target = e.target as HTMLElement;
    if (!target.classList.contains("char")) return;
    gsap.to(target, {
      y: 0,
      scale: 1,
      color: "#e5e5e5",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const replay = () => {
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
  };

  return (
    <DemoCard
      title="9 · Elastic Overshoot on Hover"
      description="Hover over any character — it pops up with elastic spring physics."
      onReplay={replay}
    >
      <p
        ref={ref}
        onMouseOver={handleCharEnter}
        onMouseOut={handleCharLeave}
        style={{ cursor: "default" }}
      >
        {SAMPLE}
      </p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  10. Typewriter With Cursor                                         */
/* ================================================================== */

function TypewriterCursor({ reduced }: { reduced: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const run = useCallback(() => {
    if (!textRef.current || reduced) return;
    tlRef.current?.kill();

    const chars = SAMPLE.split("");
    textRef.current.textContent = "";

    const tl = gsap.timeline();
    tlRef.current = tl;

    chars.forEach((char) => {
      tl.call(
        () => {
          if (textRef.current) {
            textRef.current.textContent += char;
          }
        },
        [],
        `+=${0.04 + Math.random() * 0.06}` // variable typing speed
      );
    });
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      tlRef.current?.kill();
    };
  }, [run]);

  const replay = () => {
    tlRef.current?.kill();
    if (textRef.current) textRef.current.textContent = "";
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="10 · Typewriter With Cursor"
      description="Characters appear one at a time with a blinking caret — variable keystroke speed."
      onReplay={replay}
    >
      <div ref={wrapRef} style={{ fontFamily: "monospace" }}>
        <span ref={textRef} />
        {!reduced && (
          <span
            aria-hidden
            className="inline-block h-[1em] w-[2px] translate-y-[2px] bg-white align-text-bottom"
            style={{ animation: "caretBlink 1s step-end infinite" }}
          />
        )}
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  11. Split & Separate (fly apart → reassemble)                      */
/* ================================================================== */

function SplitSeparate({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const splitRef = useRef<SplitType | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    splitRef.current?.revert();
    tlRef.current?.kill();
    const split = new SplitType(ref.current, { types: "chars" });
    splitRef.current = split;
    if (!split.chars) return;

    const tl = gsap.timeline();
    tlRef.current = tl;

    // Phase 1: characters start assembled, then fly apart
    tl.to(split.chars, {
      x: () => (Math.random() - 0.5) * 200,
      y: () => (Math.random() - 0.5) * 120,
      rotation: () => (Math.random() - 0.5) * 90,
      opacity: 0.3,
      duration: 0.6,
      stagger: 0.01,
      ease: "power2.in",
    });

    // Phase 2: reassemble
    tl.to(split.chars, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.01,
      ease: "elastic.out(1, 0.5)",
    });
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      tlRef.current?.kill();
      splitRef.current?.revert();
    };
  }, [run]);

  const replay = () => {
    tlRef.current?.kill();
    if (!ref.current) return;
    gsap.killTweensOf(ref.current.querySelectorAll("*"));
    splitRef.current?.revert();
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="11 · Split & Separate"
      description="Characters explode outward then elastically snap back into place."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  12. Gradient Reveal With Mask                                      */
/* ================================================================== */

function GradientReveal({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const run = useCallback(() => {
    if (!ref.current || reduced) return;
    tlRef.current?.kill();

    // Use a gradient mask that sweeps left to right
    const el = ref.current;

    const tl = gsap.timeline();
    tlRef.current = tl;

    // Start fully masked, sweep the gradient reveal across
    tl.fromTo(
      el,
      {
        backgroundImage:
          "linear-gradient(90deg, #e5e5e5 0%, #e5e5e5 0%, transparent 0%, transparent 100%)",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      },
      {
        backgroundImage:
          "linear-gradient(90deg, #e5e5e5 0%, #e5e5e5 100%, transparent 100%, transparent 100%)",
        duration: 1.5,
        ease: "power2.inOut",
      }
    );

    // Fade to normal solid color at the end
    tl.to(el, {
      color: "#e5e5e5",
      WebkitTextFillColor: "#e5e5e5",
      duration: 0.3,
    });
  }, [reduced]);

  useEffect(() => {
    run();
    return () => {
      tlRef.current?.kill();
    };
  }, [run]);

  const replay = () => {
    tlRef.current?.kill();
    if (!ref.current) return;
    gsap.killTweensOf(ref.current);
    // Reset to hidden state
    gsap.set(ref.current, {
      clearProps: "all",
    });
    ref.current.textContent = SAMPLE;
    requestAnimationFrame(run);
  };

  return (
    <DemoCard
      title="12 · Gradient Reveal With Mask"
      description="Text sweeps in via an animated gradient background-clip mask."
      onReplay={replay}
    >
      <p ref={ref}>{SAMPLE}</p>
    </DemoCard>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function TextAnimationsPage() {
  const reduced = usePrefersReducedMotion();

  return (
    <main className="min-h-screen bg-[#101113] px-6 py-16 text-[#e5e5e5]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/lab"
          className="mb-8 inline-block border border-[#333] px-4 py-2 text-[0.8125rem] text-[#666] transition-colors hover:border-[#555] hover:text-white"
        >
          ← Lab
        </Link>

        <header className="mb-12">
          <h1 className="text-[clamp(2.5rem,10vw,4.5rem)] font-bold leading-none tracking-tight">
            TEXT ANIMATIONS
          </h1>
          <p className="mt-2 text-sm uppercase tracking-widest text-[#666]">
            12 GSAP + SplitType Techniques
          </p>
        </header>

        {/* Caret keyframes — used by the typewriter demo */}
        <style>{`@keyframes caretBlink { 50% { opacity: 0 } }`}</style>

        <div className="grid gap-8">
          <CharFadeSlideUp reduced={reduced} />
          <WordElasticBounce reduced={reduced} />
          <LineWipeReveal reduced={reduced} />
          <ScrambleEffect reduced={reduced} />
          <RotateScaleChars reduced={reduced} />
          <BlurInStagger reduced={reduced} />
          <Perspective3DFlip reduced={reduced} />
          <WaveMotion reduced={reduced} />
          <ElasticHover reduced={reduced} />
          <TypewriterCursor reduced={reduced} />
          <SplitSeparate reduced={reduced} />
          <GradientReveal reduced={reduced} />
        </div>
      </div>
    </main>
  );
}
