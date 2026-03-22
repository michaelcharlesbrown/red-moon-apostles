# Red Moon Apostles

Generative audiovisual web experience — a standalone art piece that functions as a living instrument. The website *is* the composition. No commerce, no navigation, no instruction. The user enters a transmission already in progress and discovers through presence and movement that they are shaping what they see and hear.

**Live:** red-moon-apostles.vercel.app
**Repo:** github.com/michaelcharlesbrown/red-moon-apostles
**Dev server:** localhost:3003

## Current Status: MVP Complete

All 8 build steps confirmed working. The three core mechanics are validated:
1. Scene compositing — three layers combine and crossfade convincingly on scroll
2. Phase drift — LCM(3,4,5) = 60 scroll events before any combination repeats
3. Audio-cursor relationship — lowpass filter responds to cursor Y position

### Temporary dev elements still in code (remove before production):
- Debug overlay in `page.tsx` showing `BG: n | MG: n | FG: n` (center of viewport)
- LISTEN click prompt in `page.tsx` (needed for audio unlock, but styling is dev-quality)
- `console.log` statements in `AudioEngine.tsx`
- Atmosphere layer values are cranked up ~3x for dev visibility — dial back to tasteful levels

## File Structure

```
src/
  app/
    globals.css          — Reset + root styles. Do not change.
    layout.tsx           — Minimal shell. Title + body only. No fonts, no classes.
    page.tsx             — Root page. Composes all layers. Owns LISTEN prompt + debug overlay.
  components/
    StarField.tsx        — BG layer. Canvas star field + CSS gradient sky div.
                           600 stars with multi-frequency twinkling, color temperature variance,
                           occasional bright flares. Slow axial rotation (~96hr full cycle).
                           3 sky gradient states with opacity multipliers.
    AtmosphereLayer.tsx  — MG layer. Dual-canvas crossfade system. 4 mood states drawn
                           procedurally: warm bloom, cold mist, film grain vignette, violet wash.
                           Each state has its own mix-blend-mode. Cursor Y controls opacity.
    ForegroundLayer.tsx  — FG layer. Dual-img crossfade. Loads PNGs from public/fg/,
                           falls back to 5 inline SVG silhouettes. Preloads all assets at mount.
                           5 states.
    AudioEngine.tsx      — Web Audio API. Renders nothing. 3 stem groups (low/mid/high)
                           with crossfade scheduling. Lowpass filter controlled by cursor Y.
                           10-second master gain fade-in on start. Falls back to test files
                           if production stems not present.
    InteractionLayer.tsx — Invisible input handler. Captures wheel (with 1200ms debounce)
                           and mousemove. Fires scene.advance() on scroll.
  hooks/
    useSceneState.ts     — Shared state: bgIndex, mgIndex, fgIndex, cursorY.
                           advance() increments all three independently (mod 3, 4, 5).
                           900ms debounce prevents double-advance.
public/
  audio/                 — Audio stems. Currently contains test1-3.mp3 (short test files).
  fg/                    — Foreground PNGs. Currently contains fg-1.png through fg-3.png.
```

## Locked Architecture

These decisions are final. Do not change them.

- **Single page app.** One route, one page. No navigation, no other routes.
- **Three visual layers, independent cycle lengths.** BG: 3 states. MG: 4 states. FG: 5 states. LCM = 60.
- **Layer ownership model:**
  - BG — 100% browser generated (canvas + CSS gradients, zero image files)
  - MG — 100% browser generated (canvas atmosphere overlays, zero assets)
  - FG — one transparent PNG per state (with SVG fallback)
- **Z-index stack:** sky div (1) → star canvas (2) → atmosphere canvases (3) → foreground imgs (4) → interaction layer captures events on window
- **Audio is independent of visual.** Audio stems run on their own crossfade timers, completely decoupled from scroll-driven visual scene changes.
- **Audio triggered by explicit user gesture.** Currently: clicking LISTEN. AudioContext created and resumed inside click handler.
- **All transitions are crossfades.** Never swap content instantly. Visual transitions 1000-1400ms. Audio crossfades 20-30s.
- **Scroll advances all three layers simultaneously.** One scroll = one advance. Debounced to prevent multi-step jumps.
- **Cursor Y is the primary interaction axis.** Maps to: lowpass filter cutoff (80-9000Hz), atmosphere layer opacity (0.6-1.0).
- **No SSR for browser APIs.** All canvas, audio, and window code inside useEffect with "use client" directive.
- **No npm installs.** Use only what's already in package.json. Web Audio API and Canvas API are browser-native.
- **requestAnimationFrame only for animation.** Never setInterval for visual updates.

## Visual Language Rules

- **Silhouette is the universal language.** Foreground elements are always black silhouettes against a lit background. No color information to conflict with any sky/atmosphere.
- **The horizon line is sacred.** All FG assets share the same horizon height.
- **No visible UI.** No text, buttons, loading indicators, or Next.js defaults. The only thing visible is the experience. (LISTEN prompt is a temporary exception for audio unlock.)
- **Fail silently on missing assets.** Never show error states, broken image icons, or placeholder text.

## Audio System

### Signal Chain
```
AudioBufferSourceNodes → GainNodes (per stem) → MasterGainNode (0.85) → BiquadFilterNode (lowpass) → destination
```

### Stem Groups
| Group | Files | Loop Duration | Crossfade Interval | Crossfade Duration |
|-------|-------|--------------|-------------------|-------------------|
| Low   | low-01 to low-03.mp3 | 60-90s | 45-75s | 25s |
| Mid   | mid-01 to mid-04.mp3 | 90-120s | 60-90s | 30s |
| High  | high-01 to high-05.mp3 | 45-75s | 30-55s | 20s |

### Filter
- Type: lowpass, Q: 0.8
- Cutoff range: 80Hz (cursor at bottom) to 9000Hz (cursor at top)
- Starts fully open (9000Hz) — neutral, no audible change until user moves cursor
- Smoothed with linearRampToValueAtTime over 80ms

### Fallback Behavior
- If production stems not found, loads test1-3.mp3 (one per group)
- With single file per group, crossfade scheduling is skipped — source.loop handles playback
- Master gain fades in over 10 seconds after LISTEN click

## Asset Specs

### Foreground PNGs
- Canvas: 2800 x 1575px (16:9)
- Top 55-60%: fully transparent
- Bottom 40-45%: silhouette — cliff, rock, figure, cactus, tree
- Fill: pure flat black #000000, no gradients, no grey
- Export: PNG-24 with transparency
- Naming: `fg-01.png` through `fg-05.png`
- Location: `public/fg/`

### Audio Stems
- Format: MP3 320kbps
- Sample rate: 44.1kHz stereo
- All loops trimmed to exact bar boundaries
- Start and end with brief silence/fade to prevent click at loop point
- All in compatible keys — D and related modes
- Naming: `low-01.mp3`, `mid-02.mp3`, `high-03.mp3`, etc.
- Location: `public/audio/`

## Explicitly Out of Scope

Do not build any of these until the core experience is polished with real assets:

- Video foreground layers (WebM alpha)
- Horizontal scroll axis (X = geography, Y = time/light)
- Campfire, street lamp, or scene-specific diegetic interaction
- Shooting star / aurora inactivity mechanics
- Parallax depth effect between layers
- Reverb node or scroll velocity audio mapping
- Cursor X stereo panning
- Mobile / touch support
- Time-of-day awareness
- Collaborative presence
- Clickable scene elements
- Pinch-to-zoom gesture

## Code Patterns

- Components use inline styles (no Tailwind classes in components)
- globals.css is minimal reset only: `* { margin:0; padding:0; box-sizing:border-box }`
- Canvas refs: `useRef<HTMLCanvasElement>(null)`, always null-check before `.getContext()`
- RAF IDs stored as `useRef(0)` for cleanup in useEffect return
- Star data stored in `useRef` (not useState) to avoid re-renders
- Audio state tracked with `useRef` booleans (audioStarted)
- Custom event `rma-audio-start` dispatched on window to trigger AudioEngine
- All layer components are position:fixed, inset:0
- ForegroundLayer uses dual-slot (A/B) pattern for crossfades — same pattern used in AtmosphereLayer

## Dev Workflow

- Dev server runs on port 3003: `npm run dev`
- Deployed via Vercel on push to main
- Build with `npm run build` before pushing to catch SSR errors
- The experience should work completely with empty `public/fg/` and `public/audio/` folders
