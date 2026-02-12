"use client";

import gsap from "gsap";
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";

export interface PageSplitOverlayHandle {
  open: () => Promise<void>;
  close: () => Promise<void>;
}

interface PageSplitOverlayProps {
  /** Background color for both panels */
  color?: string;
  /** Duration for open/close animation */
  duration?: number;
}

export const PageSplitOverlay = forwardRef<
  PageSplitOverlayHandle,
  PageSplitOverlayProps
>(function PageSplitOverlay(
  { color = "#0a0a0a", duration = 0.6 },
  ref
) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    open: () => {
      return new Promise<void>((resolve) => {
        gsap.to([topRef.current, bottomRef.current], {
          y: 0,
          duration,
          ease: "power3.inOut",
          onComplete: () => resolve(),
        });
      });
    },
    close: () => {
      return new Promise<void>((resolve) => {
        gsap.to(topRef.current, {
          y: "-100%",
          duration,
          ease: "power3.inOut",
        });
        gsap.to(bottomRef.current, {
          y: "100%",
          duration,
          ease: "power3.inOut",
          onComplete: () => resolve(),
        });
      });
    },
  }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(topRef.current, { y: "-100%" });
      gsap.set(bottomRef.current, { y: "100%" });
    });

    return () => {
      gsap.killTweensOf([topRef.current, bottomRef.current]);
      ctx.revert();
    };
  }, []);

  return (
    <>
      <div
        ref={topRef}
        className="fixed inset-x-0 top-0 z-50 h-1/2 origin-top"
        style={{ backgroundColor: color }}
      />
      <div
        ref={bottomRef}
        className="fixed inset-x-0 bottom-0 z-50 h-1/2 origin-bottom"
        style={{ backgroundColor: color }}
      />
    </>
  );
});
