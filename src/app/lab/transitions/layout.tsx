"use client";

import { TransitionProvider, TransitionOverlay } from "@/components/motion/transitions";

export default function TransitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TransitionProvider>
      <TransitionOverlay />
      {children}
    </TransitionProvider>
  );
}
