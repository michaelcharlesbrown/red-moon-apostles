"use client";

import Link from "next/link";
import { StaggerReveal } from "@/components/motion";

const items = [
  "Typography",
  "Layout",
  "Color",
  "Spacing",
  "Motion",
];

export default function Lab2Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Link
        href="/lab"
        className="absolute left-6 top-6 text-sm text-foreground/60 hover:text-foreground"
      >
        ← Lab
      </Link>

      <h1 className="mb-12 text-3xl font-bold">Experiment #2 — Stagger Reveal</h1>

      <StaggerReveal
        stagger={0.08}
        duration={0.5}
        yFrom="24px"
        className="flex flex-col gap-3"
      >
        {items.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-foreground/20 bg-foreground/5 px-6 py-4 text-lg"
          >
            {item}
          </div>
        ))}
      </StaggerReveal>
    </main>
  );
}
