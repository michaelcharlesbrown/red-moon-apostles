"use client";

import gsap from "gsap";
import { useRef, useEffect, Children } from "react";

interface StaggerRevealProps {
  children: React.ReactNode;
  /** Delay between each child (seconds) */
  stagger?: number;
  /** Animation duration */
  duration?: number;
  /** Vertical offset for from state (percentage or pixels) */
  yFrom?: string;
  className?: string;
}

export function StaggerReveal({
  children,
  stagger = 0.05,
  duration = 0.5,
  yFrom = "20px",
  className,
}: StaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.children;
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: yFrom },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          ease: "power3.out",
        }
      );
    }, container);

    return () => {
      ctx.revert();
    };
  }, [stagger, duration, yFrom]);

  return (
    <div ref={containerRef} className={className}>
      {Children.toArray(children).map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  );
}
