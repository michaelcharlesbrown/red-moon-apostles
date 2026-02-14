"use client";

import Link from "next/link";
import {
  motion,
  AnimatePresence,
  Reorder,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

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
/*  Demo card wrapper                                                  */
/* ------------------------------------------------------------------ */

interface DemoCardProps {
  title: string;
  description: string;
  children: ReactNode;
  onReset?: () => void;
  /** Extra height for demos that need more space */
  tall?: boolean;
}

function DemoCard({ title, description, children, onReset, tall }: DemoCardProps) {
  return (
    <section className="rounded-lg border border-[#2a2b2f] bg-[#18191c] p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#e5e5e5]">{title}</h2>
          <p className="mt-0.5 text-xs text-[#666]">{description}</p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 cursor-pointer border border-[#555] bg-transparent px-3 py-1.5 text-xs text-[#ccc] transition-colors hover:border-[#888] hover:text-white"
          >
            Reset
          </button>
        )}
      </div>
      <div
        className={`flex items-center justify-center overflow-hidden rounded-md bg-[#101113] ${tall ? "min-h-[16rem]" : "min-h-[8rem]"} p-6`}
      >
        {children}
      </div>
    </section>
  );
}

/* ================================================================== */
/*  1. Button Hover With Spring Physics                                */
/* ================================================================== */

function SpringButton({ reduced }: { reduced: boolean }) {
  return (
    <DemoCard
      title="1 · Spring Button Hover"
      description="Hover and tap to see spring-driven scale and shadow. Try different intensities."
    >
      <div className="flex flex-wrap items-center gap-4">
        {(["gentle", "bouncy", "stiff"] as const).map((preset) => {
          const springs = {
            gentle: { stiffness: 120, damping: 14 },
            bouncy: { stiffness: 300, damping: 10 },
            stiff: { stiffness: 600, damping: 30 },
          };
          return (
            <motion.button
              key={preset}
              type="button"
              className="rounded-lg bg-[#e5e5e5] px-5 py-2.5 text-sm font-medium text-[#101113] capitalize"
              whileHover={
                reduced
                  ? {}
                  : {
                      scale: 1.08,
                      boxShadow: "0 8px 24px rgba(255,255,255,0.12)",
                    }
              }
              whileTap={reduced ? {} : { scale: 0.95 }}
              transition={{ type: "spring", ...springs[preset] }}
            >
              {preset}
            </motion.button>
          );
        })}
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  2. Card Reveal on Scroll (Viewport Detection)                      */
/* ================================================================== */

function ScrollRevealCard({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <DemoCard
      title="2 · Scroll Reveal Card"
      description="Scroll this card into view — it fades and slides up once."
    >
      <motion.div
        ref={ref}
        className="w-full max-w-xs rounded-lg border border-[#333] bg-[#1a1b1f] p-5"
        initial={reduced ? false : { opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mb-3 h-2 w-16 rounded bg-[#555]" />
        <div className="mb-2 h-2 w-full rounded bg-[#333]" />
        <div className="mb-2 h-2 w-4/5 rounded bg-[#333]" />
        <div className="h-2 w-3/5 rounded bg-[#333]" />
      </motion.div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  3. Staggered List Reveal                                           */
/* ================================================================== */

function StaggeredList({ reduced }: { reduced: boolean }) {
  const [key, setKey] = useState(0);
  const items = ["Authenticate user", "Fetch dashboard data", "Render widgets", "Connect WebSocket", "Sync notifications"];

  return (
    <DemoCard
      title="3 · Staggered List Reveal"
      description="Items enter one-by-one with staggered spring timing."
      onReset={() => setKey((k) => k + 1)}
    >
      <motion.ul
        key={key}
        className="flex w-full max-w-xs flex-col gap-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {items.map((item, i) => (
          <motion.li
            key={i}
            className="flex items-center gap-3 rounded-md bg-[#1a1b1f] px-4 py-2.5 text-sm"
            variants={
              reduced
                ? { hidden: {}, visible: {} }
                : {
                    hidden: { opacity: 0, x: -20 },
                    visible: {
                      opacity: 1,
                      x: 0,
                      transition: {
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                      },
                    },
                  }
            }
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {item}
          </motion.li>
        ))}
      </motion.ul>
    </DemoCard>
  );
}

/* ================================================================== */
/*  4. Magnetic Button (Follows Cursor)                                */
/* ================================================================== */

function MagneticButton({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouse = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (reduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) * 0.3);
      y.set((e.clientY - centerY) * 0.3);
    },
    [reduced, x, y]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <DemoCard
      title="4 · Magnetic Button"
      description="Move your cursor near the button — it follows with spring physics."
    >
      <div
        className="flex h-32 w-full items-center justify-center"
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
      >
        <motion.button
          ref={ref}
          type="button"
          className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#101113]"
          style={{ x: springX, y: springY }}
        >
          Hover near me
        </motion.button>
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  5. Tap to Expand Card                                              */
/* ================================================================== */

function TapExpandCard({ reduced }: { reduced: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <DemoCard
      title="5 · Tap to Expand"
      description="Click the card to toggle between collapsed and expanded states."
      tall
    >
      <motion.div
        className="cursor-pointer overflow-hidden rounded-lg bg-[#1a1b1f] text-sm"
        animate={{
          width: expanded ? 300 : 200,
          height: expanded ? 180 : 80,
        }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 300, damping: 25 }
        }
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="p-4">
          <div className="mb-2 font-semibold">Project Alpha</div>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-[#888]"
              >
                <p>Status: In Progress</p>
                <p className="mt-1">Team: 4 members</p>
                <p className="mt-1">Due: March 2026</p>
                <p className="mt-2 text-[#555]">Click to collapse</p>
              </motion.div>
            )}
          </AnimatePresence>
          {!expanded && (
            <p className="text-xs text-[#555]">Click to expand</p>
          )}
        </div>
      </motion.div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  6. Drag to Reorder List                                            */
/* ================================================================== */

function DragReorderList({ reduced }: { reduced: boolean }) {
  const [items, setItems] = useState(["Design", "Develop", "Test", "Deploy"]);

  return (
    <DemoCard
      title="6 · Drag to Reorder"
      description="Drag items to rearrange the list. Uses Framer Motion's Reorder API."
      onReset={() => setItems(["Design", "Develop", "Test", "Deploy"])}
    >
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="flex w-full max-w-xs flex-col gap-1.5"
      >
        {items.map((item) => (
          <Reorder.Item
            key={item}
            value={item}
            className="flex cursor-grab items-center gap-3 rounded-md bg-[#1a1b1f] px-4 py-2.5 text-sm select-none active:cursor-grabbing"
            whileDrag={
              reduced
                ? {}
                : {
                    scale: 1.03,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                    backgroundColor: "#242529",
                  }
            }
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <span className="text-[#555]">⠿</span>
            {item}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </DemoCard>
  );
}

/* ================================================================== */
/*  7. Modal With Backdrop Blur                                        */
/* ================================================================== */

function ModalDemo({ reduced }: { reduced: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <DemoCard title="7 · Modal + Backdrop" description="Open a modal with animated backdrop blur and spring-scaled content.">
      <div className="relative flex h-32 w-full items-center justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-[#e5e5e5] px-5 py-2 text-sm font-medium text-[#101113]"
        >
          Open Modal
        </button>

        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 z-10 rounded-md bg-black/60 backdrop-blur-sm"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />
              {/* Modal */}
              <motion.div
                className="absolute z-20 w-56 rounded-lg bg-[#1a1b1f] p-5 shadow-xl"
                initial={reduced ? false : { opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 350, damping: 25 }
                }
              >
                <h3 className="mb-2 text-sm font-semibold">Confirm Action</h3>
                <p className="mb-4 text-xs text-[#888]">
                  This is a spring-animated modal with backdrop blur.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-[#101113]"
                >
                  Dismiss
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  8. Toast Notification With Exit Animation                          */
/* ================================================================== */

let toastId = 0;

function ToastNotification({ reduced }: { reduced: boolean }) {
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);

  const addToast = () => {
    const id = ++toastId;
    const messages = [
      "File saved successfully",
      "Build completed",
      "Deployed to production",
      "Changes synced",
    ];
    setToasts((prev) => [
      ...prev,
      { id, text: messages[id % messages.length] },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  return (
    <DemoCard
      title="8 · Toast Notifications"
      description="Click to spawn toasts that auto-dismiss with exit animations."
      tall
    >
      <div className="relative flex h-48 w-full flex-col items-center">
        <button
          type="button"
          onClick={addToast}
          className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-medium text-white"
        >
          Trigger Toast
        </button>

        <div className="absolute bottom-0 right-0 flex flex-col-reverse gap-2">
          <AnimatePresence mode="popLayout">
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                layout
                className="rounded-md bg-[#1a1b1f] px-4 py-2.5 text-xs shadow-lg"
                initial={reduced ? false : { opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, x: 40, scale: 0.9 }
                }
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <span className="mr-2 text-emerald-400">✓</span>
                {toast.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  9. Accordion With Smooth Height                                    */
/* ================================================================== */

const accordionItems = [
  {
    title: "What is Framer Motion?",
    content:
      "A production-ready motion library for React. It provides declarative animations, gestures, and layout transitions.",
  },
  {
    title: "How does spring physics work?",
    content:
      "Springs are defined by stiffness, damping, and mass. Higher stiffness creates snappier motion; lower damping creates more bounce.",
  },
  {
    title: "What about accessibility?",
    content:
      "Framer Motion respects prefers-reduced-motion. You can conditionally disable animations or reduce their intensity.",
  },
];

function Accordion({ reduced }: { reduced: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <DemoCard
      title="9 · Accordion"
      description="Smooth height animation powered by AnimatePresence."
      onReset={() => setOpenIndex(null)}
    >
      <div className="w-full max-w-sm">
        {accordionItems.map((item, i) => (
          <div key={i} className="border-b border-[#2a2b2f] last:border-0">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between py-3 text-left text-sm font-medium"
            >
              {item.title}
              <motion.span
                className="text-[#666]"
                animate={{ rotate: openIndex === i ? 180 : 0 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 300, damping: 25 }
                }
              >
                ▾
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  className="overflow-hidden"
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
                  }
                >
                  <p className="pb-3 text-xs leading-relaxed text-[#888]">
                    {item.content}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  10. Toggle Switch With Physics                                     */
/* ================================================================== */

function ToggleSwitch({ reduced }: { reduced: boolean }) {
  const [on, setOn] = useState(false);

  return (
    <DemoCard
      title="10 · Physics Toggle"
      description="A toggle switch with spring-animated knob and color transitions."
    >
      <div className="flex items-center gap-6">
        {(["default", "bouncy", "snappy"] as const).map((preset) => {
          const springs = {
            default: { type: "spring" as const, stiffness: 500, damping: 30 },
            bouncy: { type: "spring" as const, stiffness: 200, damping: 10 },
            snappy: { type: "spring" as const, stiffness: 700, damping: 35 },
          };
          return (
            <div key={preset} className="flex flex-col items-center gap-2">
              <button
                type="button"
                className="relative flex h-7 w-12 cursor-pointer items-center rounded-full p-1 transition-colors"
                style={{ background: on ? "#10b981" : "#333" }}
                onClick={() => setOn((v) => !v)}
                aria-label={`${preset} toggle`}
                role="switch"
                aria-checked={on}
              >
                <motion.div
                  className="h-5 w-5 rounded-full bg-white shadow-md"
                  animate={{ x: on ? 20 : 0 }}
                  transition={reduced ? { duration: 0 } : springs[preset]}
                />
              </button>
              <span className="text-[10px] text-[#666] capitalize">
                {preset}
              </span>
            </div>
          );
        })}
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  11. Loading Spinner Variants                                       */
/* ================================================================== */

function LoadingSpinners({ reduced }: { reduced: boolean }) {
  return (
    <DemoCard
      title="11 · Loading Spinners"
      description="Three loading patterns — rotating ring, pulsing dots, and scaling bars."
    >
      <div className="flex items-center gap-12">
        {/* Spinner ring */}
        <motion.div
          className="h-8 w-8 rounded-full border-2 border-[#333] border-t-white"
          animate={reduced ? {} : { rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 0.8,
            ease: "linear",
          }}
        />

        {/* Pulsing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-white"
              animate={
                reduced
                  ? {}
                  : { scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }
              }
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Scaling bars */}
        <div className="flex items-end gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-white"
              animate={
                reduced
                  ? { height: 16 }
                  : { height: [8, 24, 8] }
              }
              transition={{
                repeat: Infinity,
                duration: 0.7,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  12. Gesture-Controlled Carousel                                    */
/* ================================================================== */

const carouselSlides = [
  { bg: "#1e3a5f", label: "Slide 1" },
  { bg: "#3b1e5f", label: "Slide 2" },
  { bg: "#5f1e3a", label: "Slide 3" },
  { bg: "#1e5f3a", label: "Slide 4" },
];

function GestureCarousel({ reduced }: { reduced: boolean }) {
  const [index, setIndex] = useState(0);
  const dragX = useMotionValue(0);
  const dragProgress = useTransform(dragX, [-150, 0, 150], [-1, 0, 1]);
  const bgOpacity = useTransform(dragProgress, [-1, 0, 1], [0.3, 1, 0.3]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 50;
    const velocityThreshold = 300;
    if (
      info.offset.x < -threshold ||
      info.velocity.x < -velocityThreshold
    ) {
      setIndex((i) => Math.min(i + 1, carouselSlides.length - 1));
    } else if (
      info.offset.x > threshold ||
      info.velocity.x > velocityThreshold
    ) {
      setIndex((i) => Math.max(i - 1, 0));
    }
  };

  return (
    <DemoCard
      title="12 · Gesture Carousel"
      description="Swipe left/right or use dots to navigate. Spring physics on release."
      onReset={() => setIndex(0)}
      tall
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <div className="relative h-36 w-full overflow-hidden rounded-lg">
          <motion.div
            className="flex h-full"
            animate={{ x: -index * 100 + "%" }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 30 }
            }
            drag={reduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x: dragX }}
          >
            {carouselSlides.map((slide, i) => (
              <motion.div
                key={i}
                className="flex h-full w-full shrink-0 items-center justify-center rounded-lg text-lg font-bold"
                style={{
                  backgroundColor: slide.bg,
                  opacity: i === index ? bgOpacity : 0.6,
                }}
              >
                {slide.label}
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {carouselSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="p-1"
              aria-label={`Go to slide ${i + 1}`}
            >
              <motion.div
                className="h-2 w-2 rounded-full"
                animate={{
                  backgroundColor: i === index ? "#e5e5e5" : "#555",
                  scale: i === index ? 1.3 : 1,
                }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 400, damping: 25 }
                }
              />
            </button>
          ))}
        </div>
      </div>
    </DemoCard>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export default function UiAnimationsPage() {
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
            UI ANIMATIONS
          </h1>
          <p className="mt-2 text-sm uppercase tracking-widest text-[#666]">
            12 Framer Motion Patterns
          </p>
        </header>

        <div className="grid gap-8">
          <SpringButton reduced={reduced} />
          <ScrollRevealCard reduced={reduced} />
          <StaggeredList reduced={reduced} />
          <MagneticButton reduced={reduced} />
          <TapExpandCard reduced={reduced} />
          <DragReorderList reduced={reduced} />
          <ModalDemo reduced={reduced} />
          <ToastNotification reduced={reduced} />
          <Accordion reduced={reduced} />
          <ToggleSwitch reduced={reduced} />
          <LoadingSpinners reduced={reduced} />
          <GestureCarousel reduced={reduced} />
        </div>
      </div>
    </main>
  );
}
