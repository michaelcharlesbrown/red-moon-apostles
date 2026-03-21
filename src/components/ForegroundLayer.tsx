"use client"

import { useEffect, useRef, useState } from "react"

const FG_ASSETS = ["fg-01.png", "fg-02.png", "fg-03.png", "fg-04.png", "fg-05.png"]

// 5 distinct cliff/horizon SVG fallbacks
const SVG_FALLBACKS = [
  // Jagged cliff left
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 400"><path d="M0 400V220l80-30 120 10 60-50 100-20 80 40 60-60 140-10 40 30 100-40 80 20 60-30 120 10 60 40 100-20 100 30V400z" fill="#000"/></svg>')}`,
  // Mesa plateau
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 400"><path d="M0 400V280l200-10 40-80h180l20 60 160-10 20-50h120l30 50 180-10 30-40h140l20 40 160-10 60 30V400z" fill="#000"/></svg>')}`,
  // Rolling hills with figure
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 400"><path d="M0 400V300q200-80 400-40t350-60 300 20 350-40V400z" fill="#000"/><ellipse cx="700" cy="210" rx="8" ry="25" fill="#000"/><ellipse cx="700" cy="185" rx="10" ry="10" fill="#000"/></svg>')}`,
  // Cactus desert
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 400"><path d="M0 400V320l1400-20V400z" fill="#000"/><rect x="300" y="200" width="16" height="120" fill="#000"/><rect x="316" y="240" width="30" height="12" fill="#000"/><rect x="346" y="240" width="12" height="50" fill="#000"/><rect x="270" y="260" width="30" height="12" fill="#000"/><rect x="270" y="220" width="12" height="52" fill="#000"/><rect x="900" y="230" width="14" height="90" fill="#000"/><rect x="914" y="260" width="25" height="10" fill="#000"/><rect x="939" y="250" width="10" height="40" fill="#000"/></svg>')}`,
  // Distant mountain range
  `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 400"><path d="M0 400V300l100-60 80 30 120-90 100 50 60-40 140-80 100 60 80-30 60 50 120-70 80 40 100-50 60 30 100-40 100 60V400z" fill="#000"/></svg>')}`,
]

export default function ForegroundLayer({ fgIndex }: { fgIndex: number }) {
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A")
  const [srcA, setSrcA] = useState(SVG_FALLBACKS[0])
  const [srcB, setSrcB] = useState(SVG_FALLBACKS[0])
  const [opacityA, setOpacityA] = useState(1)
  const [opacityB, setOpacityB] = useState(0)
  const prevIndex = useRef(fgIndex)
  const preloaded = useRef<Record<string, boolean>>({})

  // Preload all PNGs at mount
  useEffect(() => {
    FG_ASSETS.forEach((file) => {
      const img = new Image()
      img.onload = () => { preloaded.current[file] = true }
      img.onerror = () => { preloaded.current[file] = false }
      img.src = `/fg/${file}`
    })
  }, [])

  // Resolve source: PNG if available, else SVG fallback
  const resolve = (index: number): Promise<string> => {
    const file = FG_ASSETS[index]
    if (preloaded.current[file]) return Promise.resolve(`/fg/${file}`)

    return new Promise((res) => {
      const img = new Image()
      img.onload = () => {
        preloaded.current[file] = true
        res(`/fg/${file}`)
      }
      img.onerror = () => {
        preloaded.current[file] = false
        res(SVG_FALLBACKS[index])
      }
      img.src = `/fg/${file}`
    })
  }

  // Crossfade on fgIndex change
  useEffect(() => {
    if (fgIndex === prevIndex.current) return
    prevIndex.current = fgIndex

    resolve(fgIndex).then((src) => {
      if (activeSlot === "A") {
        setSrcB(src)
        setOpacityA(0)
        setOpacityB(1)
        setActiveSlot("B")
      } else {
        setSrcA(src)
        setOpacityB(0)
        setOpacityA(1)
        setActiveSlot("A")
      }
    })
  }, [fgIndex, activeSlot])

  const baseStyle: React.CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 4,
    pointerEvents: "none",
    objectFit: "cover",
    objectPosition: "bottom center",
    transition: "opacity 1400ms ease-in-out",
  }

  return (
    <>
      <img src={srcA} alt="" style={{ ...baseStyle, opacity: opacityA }} />
      <img src={srcB} alt="" style={{ ...baseStyle, opacity: opacityB }} />
    </>
  )
}
