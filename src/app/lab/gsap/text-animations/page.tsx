"use client";

import Link from "next/link";

export default function TextAnimationsPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#101113] px-6 py-16 text-[#e5e5e5]">
      <Link
        href="/lab"
        className="mb-8 inline-block self-start border border-[#333] px-4 py-2 text-sm text-[#666] transition-colors hover:border-[#555] hover:text-white"
      >
        ← Lab
      </Link>

      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        Text Animations
      </h1>
      <p className="mt-2 text-[#888]">
        GSAP-powered text motion — split reveals, staggered characters, kinetic
        typography, and scroll-triggered text effects.
      </p>

      <div className="mt-12 rounded-xl border border-[#2a2b2f] bg-[#18191c] p-8 text-center text-[#555]">
        Experiments coming soon
      </div>
    </main>
  );
}
