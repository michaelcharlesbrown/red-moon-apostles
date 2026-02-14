import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

const gsapExperiments = [
  {
    title: "Text Animations",
    href: "/lab/gsap/text-animations",
    description:
      "Split reveals, staggered characters, kinetic typography, and scroll-triggered text effects.",
  },
  {
    title: "Scroll Effects",
    href: "/lab/gsap/scroll-effects",
    description:
      "ScrollTrigger-driven parallax, pinning, scrub animations, and progress indicators.",
  },
  {
    title: "Timeline Sequences",
    href: "/lab/gsap/timeline-sequences",
    description:
      "Complex multi-step timelines — orchestrated entrances, chained transitions, and playback control.",
  },
  {
    title: "Page Split + Text Reveal",
    href: "/lab/1",
    description:
      "Horizontal split overlay with open/close, character-level text reveal.",
  },
  {
    title: "Stagger Reveal",
    href: "/lab/2",
    description:
      "List items animate in with configurable stagger delay and vertical offset.",
  },
  {
    title: "Typography Patterns",
    href: "/lab/typography",
    description:
      "Six modes: line-reveal, char-cascade, word-lift, scramble, typewriter, emphasis.",
  },
  {
    title: "Transitions",
    href: "/lab/transitions",
    description:
      "Multi-layer page reveal variants: triple swoosh, simple, duo, content.",
  },
  {
    title: "Rapid Layers",
    href: "/lab/transitions/rapid-layers",
    description:
      "Image-based rapid layer animation with opposite-direction transforms.",
  },
] as const;

const framerMotionExperiments = [
  {
    title: "UI Animations",
    href: "/lab/framer-motion/ui-animations",
    description:
      "Declarative hover states, mount/unmount transitions, gestures, and spring physics.",
  },
  {
    title: "Page Transitions",
    href: "/lab/framer-motion/page-transitions",
    description:
      "AnimatePresence route transitions, shared layout animations, and cross-fade patterns.",
  },
  {
    title: "Layout Animations",
    href: "/lab/framer-motion/layout-animations",
    description:
      "Automatic layout transitions — list reordering, shared element morphing, and fluid grids.",
  },
] as const;

const advancedEffects = [
  {
    title: "Grain (PNG Overlay)",
    href: "/lab/grain",
    description:
      "Static texture-based film grain with optional GSAP pulse animation.",
  },
  {
    title: "Grain (Canvas Generator)",
    href: "/lab/grain/generate",
    description:
      "Procedural tileable grain — configurable size, amount, blur, and contrast with PNG export.",
  },
  {
    title: "Grain (SVG Turbulence)",
    href: "/lab/grain/turbulence",
    description:
      "feTurbulence-powered animated grain overlay. No canvas, no external assets.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-foreground/50">{description}</p>
    </div>
  );
}

function ExperimentCard({
  title,
  href,
  description,
}: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-foreground/10 p-5 transition-colors hover:border-foreground/30 hover:bg-foreground/5"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-foreground/60">{description}</p>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LabPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        MCB Motion Lab
      </h1>
      <p className="mt-2 text-foreground/60">
        A reference library of animation components, patterns, and effects.
      </p>

      {/* ---- GSAP ---- */}
      <section className="mt-14">
        <SectionHeading
          title="GSAP Experiments"
          description="Low-level, high-performance animation control. Best for scroll-driven effects, complex timelines, fine-grained easing, and canvas/WebGL integration."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {gsapExperiments.map((exp) => (
            <ExperimentCard key={exp.href} {...exp} />
          ))}
        </div>
      </section>

      {/* ---- Framer Motion ---- */}
      <section className="mt-14">
        <SectionHeading
          title="Framer Motion Experiments"
          description="Declarative, React-native animation. Best for component transitions, layout animations, gesture handling, and spring physics out of the box."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {framerMotionExperiments.map((exp) => (
            <ExperimentCard key={exp.href} {...exp} />
          ))}
        </div>
      </section>

      {/* ---- Advanced Effects ---- */}
      <section className="mt-14">
        <SectionHeading
          title="Advanced Effects"
          description="Texture overlays, procedural generation, and post-processing techniques using Canvas 2D, SVG filters, and static assets."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {advancedEffects.map((exp) => (
            <ExperimentCard key={exp.href} {...exp} />
          ))}
        </div>
      </section>
    </main>
  );
}
