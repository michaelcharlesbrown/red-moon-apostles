"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useTransitionController } from "./TransitionContext";

export function useNavigateWithTransition() {
  const router = useRouter();
  const { playCover, playReveal } = useTransitionController();

  const navigateWithTransition = useCallback(
    async (href: string) => {
      document.body.style.pointerEvents = "none";
      try {
        await playCover();
        router.push(href);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            playReveal().finally(() => {
              document.body.style.pointerEvents = "";
            });
          });
        });
      } catch (e) {
        document.body.style.pointerEvents = "";
      }
    },
    [router, playCover, playReveal]
  );

  return { navigateWithTransition };
}
