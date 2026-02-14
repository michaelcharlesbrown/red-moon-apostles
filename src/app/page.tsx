"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface ExperimentLink {
  title: string;
  href: string;
  active: boolean;
}

interface Section {
  label: string;
  title: string;
  description: string;
  links: ExperimentLink[];
  accentColor: string;
}

const sections: Section[] = [
  {
    label: "01",
    title: "GSAP Experiments",
    description:
      "Industry-standard animation library for complex scroll effects, timeline sequences, and cutting-edge creative work. What agencies use for hero sections and immersive experiences.",
    accentColor: "#3b82f6",
    links: [
      { title: "Text Animations", href: "/lab/gsap/text-animations", active: true },
      { title: "Scroll Effects", href: "/lab/gsap/scroll-effects", active: false },
      { title: "Timeline Sequences", href: "/lab/gsap/timeline-sequences", active: false },
      { title: "Typography Patterns", href: "/lab/typography", active: true },
      { title: "Page Transitions", href: "/lab/transitions", active: true },
    ],
  },
  {
    label: "02",
    title: "Framer Motion Experiments",
    description:
      "React-native animation library for UI micro-interactions, page transitions, and component animations. Perfect for polished user interfaces and interactive elements.",
    accentColor: "#a855f7",
    links: [
      { title: "UI Animations", href: "/lab/framer-motion/ui-animations", active: true },
      { title: "Page Transitions", href: "/lab/framer-motion/page-transitions", active: false },
      { title: "Layout Animations", href: "/lab/framer-motion/layout-animations", active: false },
    ],
  },
  {
    label: "03",
    title: "Advanced Effects",
    description:
      "Experimental canvas-based effects, SVG filters, and procedural generation techniques for texture, depth, and visual polish.",
    accentColor: "#10b981",
    links: [
      { title: "Grain Effect Generator", href: "/lab/grain/generate", active: true },
      { title: "Turbulence Effect", href: "/lab/grain/turbulence", active: true },
      { title: "Film Grain Overlay", href: "/lab/grain", active: true },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function SectionCard({
  section,
  animate,
}: {
  section: Section;
  animate: boolean;
}) {
  const activeCount = section.links.filter((l) => l.active).length;
  const totalCount = section.links.length;

  const Wrapper = animate ? motion.section : "section";
  const wrapperProps = animate ? { variants: fadeUp } : {};

  return (
    <Wrapper
      className="group rounded-xl border border-[#1e1f23] bg-[#111214] p-6 transition-colors hover:border-[#2a2b30] sm:p-8"
      {...wrapperProps}
    >
      {/* Header */}
      <div className="mb-5 flex items-baseline justify-between">
        <span
          className="text-xs font-semibold tracking-widest"
          style={{ color: section.accentColor }}
        >
          {section.label}
        </span>
        <span className="text-xs text-[#555]">
          {activeCount}/{totalCount} active
        </span>
      </div>

      <h2 className="text-lg font-bold tracking-tight text-[#e5e5e5] sm:text-xl">
        {section.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#777]">
        {section.description}
      </p>

      {/* Links */}
      <ul className="mt-6 flex flex-col gap-1">
        {section.links.map((link) => (
          <li key={link.href}>
            {link.active ? (
              <Link
                href={link.href}
                className="group/link flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5"
              >
                <span className="text-[#ccc] transition-colors group-hover/link:text-white">
                  {link.title}
                </span>
                <span className="text-[#444] transition-transform group-hover/link:translate-x-0.5 group-hover/link:text-[#888]">
                  &rarr;
                </span>
              </Link>
            ) : (
              <span className="flex items-center justify-between rounded-md px-3 py-2 text-sm">
                <span className="text-[#444]">{link.title}</span>
                <span className="rounded bg-[#1a1b1f] px-1.5 py-0.5 text-[10px] text-[#555]">
                  soon
                </span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const reduced = useReducedMotion() ?? false;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only animate after hydration — SSR renders fully visible
  const shouldAnimate = mounted && !reduced;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e5e5e5]">
      {shouldAnimate ? (
        <motion.main
          className="mx-auto max-w-5xl px-6 py-20 sm:py-28"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* ---- Hero ---- */}
          <motion.header className="mb-20" variants={fadeUp}>
            <HeroContent />
          </motion.header>

          {/* ---- Section cards ---- */}
          <motion.div
            className="grid gap-5 md:grid-cols-3"
            variants={containerVariants}
          >
            {sections.map((section) => (
              <SectionCard
                key={section.label}
                section={section}
                animate={true}
              />
            ))}
          </motion.div>

          {/* ---- Stats bar ---- */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-[#1e1f23] pt-10 text-center"
            variants={fadeUp}
          >
            <StatsContent />
          </motion.div>
        </motion.main>
      ) : (
        <main className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          {/* ---- Hero ---- */}
          <header className="mb-20">
            <HeroContent />
          </header>

          {/* ---- Section cards ---- */}
          <div className="grid gap-5 md:grid-cols-3">
            {sections.map((section) => (
              <SectionCard
                key={section.label}
                section={section}
                animate={false}
              />
            ))}
          </div>

          {/* ---- Stats bar ---- */}
          <div className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-4 border-t border-[#1e1f23] pt-10 text-center">
            <StatsContent />
          </div>
        </main>
      )}

      {/* ---- Footer ---- */}
      <footer className="border-t border-[#1e1f23] py-8 text-center text-xs text-[#444]">
        Built with Next.js, TypeScript, GSAP &amp; Framer Motion
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared content extracted to avoid duplication                       */
/* ------------------------------------------------------------------ */

function HeroContent() {
  return (
    <>
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#555]">
        Animation Reference Library
      </p>
      <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
        MCB Motion
        <br />
        <span className="text-[#555]">Lab</span>
      </h1>
      <p className="mt-6 max-w-lg text-base leading-relaxed text-[#777]">
        A comprehensive collection of GSAP and Framer Motion techniques,
        built in Next.js. Created by Michael Bailey as a reference for
        portfolio and client projects.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/lab"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#0a0a0b] transition-opacity hover:opacity-90"
        >
          Browse All Experiments
        </Link>
        <a
          href="https://github.com/michaelcharlesbrown/mcb-motion-lab"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-[#2a2b2f] px-5 py-2.5 text-sm font-medium text-[#999] transition-colors hover:border-[#444] hover:text-white"
        >
          GitHub
        </a>
      </div>
    </>
  );
}

function StatsContent() {
  const stats = [
    { value: "24+", label: "Animation demos" },
    { value: "2", label: "Animation libraries" },
    { value: "12", label: "Interactive UI patterns" },
    { value: "3", label: "Grain techniques" },
  ];

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label}>
          <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
          <div className="mt-0.5 text-xs text-[#555]">{stat.label}</div>
        </div>
      ))}
    </>
  );
}
