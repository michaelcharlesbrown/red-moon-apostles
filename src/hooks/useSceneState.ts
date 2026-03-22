"use client"

import { useState, useCallback, useRef } from "react"

const BG_COUNT = 3
const MG_COUNT = 4
const FG_COUNT = 5
const DEBOUNCE_MS = 900

export function useSceneState() {
  const [bgIndex, setBgIndex] = useState(0)
  const [mgIndex, setMgIndex] = useState(0)
  const [fgIndex, setFgIndex] = useState(0)
  const [cursorY, setCursorY] = useState(1.0)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const isTransitioning = useRef(false)

  const advance = useCallback(() => {
    if (isTransitioning.current) return
    isTransitioning.current = true
    setIsAdvancing(true)
    setBgIndex(i => (i + 1) % BG_COUNT)
    setMgIndex(i => (i + 1) % MG_COUNT)
    setFgIndex(i => (i + 1) % FG_COUNT)
    setTimeout(() => { isTransitioning.current = false }, DEBOUNCE_MS)
    setTimeout(() => { setIsAdvancing(false) }, 1400)
  }, [])

  return { bgIndex, mgIndex, fgIndex, cursorY, setCursorY, advance, isAdvancing }
}
