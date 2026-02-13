"use client";

import { createContext, useContext, useState, useCallback } from "react";

export type TransitionVariant = "triple" | "simple" | "duo" | "content";

interface TransitionController {
  playCover: () => Promise<void>;
  playReveal: () => Promise<void>;
  setVariant: (v: TransitionVariant) => void;
}

const defaultController: TransitionController = {
  playCover: () => Promise.resolve(),
  playReveal: () => Promise.resolve(),
  setVariant: () => {},
};

const TransitionContext = createContext<{
  controller: TransitionController;
  register: (c: TransitionController) => void;
}>({
  controller: defaultController,
  register: () => {},
});

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const [controller, setController] = useState<TransitionController>(defaultController);
  const register = useCallback((c: TransitionController) => setController(c), []);
  return (
    <TransitionContext.Provider value={{ controller, register }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function useTransitionController() {
  return useContext(TransitionContext).controller;
}

export function useTransitionContext() {
  return useContext(TransitionContext);
}
