"use client";

import gsap from "gsap";
import { useRef, useEffect, useMemo } from "react";

interface TextRevealProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
}

export function TextReveal({ children, as: Tag = "h1", className }: TextRevealProps) {
  const containerRef = useRef<HTMLElement>(null);
  const chars = useMemo(() => children.split(""), [children]);

  useEffect(() => {
    const spans = containerRef.current?.querySelectorAll(".char-wrap");
    if (!spans?.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        spans,
        { y: "110%" },
        {
          y: "0%",
          duration: 0.6,
          stagger: 0.03,
          ease: "power3.out",
          overwrite: true,
        }
      );
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [chars.join("")]);

  return (
    <Tag className={className}>
      <span ref={containerRef} className="inline-block overflow-hidden">
        {chars.map((char, i) => (
          <span key={i} className="char-wrap inline-block overflow-hidden">
            <span className="inline-block">{char}</span>
          </span>
        ))}
      </span>
    </Tag>
  );
}
