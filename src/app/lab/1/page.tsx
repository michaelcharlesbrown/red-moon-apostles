"use client";

import Link from "next/link";
import { useRef } from "react";
import { PageSplitOverlay, TextReveal } from "@/components/motion";
import type { PageSplitOverlayHandle } from "@/components/motion";

export default function Lab1Page() {
  const overlayRef = useRef<PageSplitOverlayHandle>(null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Link
        href="/lab"
        className="absolute left-6 top-6 text-sm text-foreground/60 hover:text-foreground"
      >
        ← Lab
      </Link>

      <TextReveal as="h1" className="text-4xl font-bold md:text-5xl">
        Experiment #1 — Page Split + Text Reveal
      </TextReveal>

      <button
        type="button"
        onClick={() => {
          overlayRef.current?.open().then(() => {
            setTimeout(() => overlayRef.current?.close(), 800);
          });
        }}
        className="mt-12 rounded-lg bg-foreground px-6 py-3 text-background transition-opacity hover:opacity-90"
      >
        Trigger Split Overlay
      </button>

      <PageSplitOverlay ref={overlayRef} />
    </main>
  );
}
