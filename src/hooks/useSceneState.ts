"use client"

import { useState, useCallback, useRef, useEffect, MutableRefObject } from "react"

const ADVANCE_DEBOUNCE_MS = 900

export function useSceneState() {
  const [bgIndex, setBgIndex] = useState(0)
  const [mgIndex, setMgIndex] = useState(0)
  const [fgIndex, setFgIndex] = useState(0)
  const [cursorX, setCursorX] = useState(0)
  const [cursorY, setCursorY] = useState(0)

  // scrollOffset lives in a ref — updated by wheel events and decayed by RAF.
  // Canvas components read this ref directly inside their own RAF loops and
  // apply CSS transforms there, avoiding 60fps React re-renders entirely.
  const scrollOffsetRef: MutableRefObject<number> = useRef(0)
  // cursorRef mirrors cursorX/Y as a ref so canvas components can read it
  // inside their RAF loops without triggering re-renders on every mousemove
  const cursorRef: MutableRefObject<{ x: number; y: number }> = useRef({ x: 0, y: 0 })
  const decayRafRef = useRef(0)
  const isTransitioning = useRef(false)

  // Decay loop — runs continuously, no React state touched
  useEffect(() => {
    const decay = () => {
      scrollOffsetRef.current *= 0.88
      if (Math.abs(scrollOffsetRef.current) < 0.01) scrollOffsetRef.current = 0
      decayRafRef.current = requestAnimationFrame(decay)
    }
    decayRafRef.current = requestAnimationFrame(decay)
    return () => cancelAnimationFrame(decayRafRef.current)
  }, [])

  const advance = useCallback(() => {
    if (isTransitioning.current) return
    isTransitioning.current = true
    setBgIndex(i => (i + 1) % 3)
    setMgIndex(i => (i + 1) % 4)
    setFgIndex(i => (i + 1) % 3)
    setTimeout(() => { isTransitioning.current = false }, ADVANCE_DEBOUNCE_MS)
  }, [])

  const setCursor = useCallback((x: number, y: number) => {
    setCursorX(x)
    setCursorY(y)
    cursorRef.current = { x, y }
  }, [])

  const addScrollDelta = useCallback((deltaY: number) => {
    scrollOffsetRef.current = Math.max(
      -90,
      Math.min(90, scrollOffsetRef.current + deltaY * 0.15)
    )
  }, [])

  return {
    bgIndex,
    mgIndex,
    fgIndex,
    cursorX,
    cursorY,
    scrollOffsetRef,
    cursorRef,
    advance,
    setCursor,
    addScrollDelta,
  }
}
