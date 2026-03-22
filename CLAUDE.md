# Red Moon Apostles — Technical Reference

Place at project root. Claude Code reads this automatically every session.

## Project Overview

Red Moon Apostles is a generative audiovisual art experience. A sound engine with a visual world. One deeply crafted scene inhabited by original ambient music that evolves endlessly. The black sun at the center of the screen is both the visual anchor and the audio instrument — the visitor's cursor relationship to the sun controls all sound parameters. No UI. No instructions. Discovery through exploration.

- Local: localhost:3003
- GitHub: michaelcharlesbrown/red-moon-apostles
- Vercel: red-moon-apostles.vercel.app
- Domain: redmoonapostles.com

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Canvas API — browser native, no library
- Web Audio API — browser native, no library
- React hooks for all state management

## Component Architecture

### Visual Components

- **SkyCanvas.tsx** — Deep space. Stars, Milky Way, sky gradient, sun corona. z-index 1. Parallax 0.015.
- **CloudCanvas.tsx** — Atmosphere. Turbulent red cloud formations. z-index 2. Parallax 0.06.
- **TerrainCanvas.tsx** — Geology. Dark textured landscape with three biomes. z-index 3. Parallax 0.18.
- **SunCanvas.tsx** — The black sun. z-index 4. NEVER moves. NEVER fades. NEVER transitions. NEVER animates.

### System Components

- **AudioEngine.tsx** — Web Audio API. Shuffled stems, black sun instrument model, signal chain.
- **InteractionLayer.tsx** — Invisible div. Captures wheel, mousemove, click. Fires rma-audio-start.
- **EntryScreen.tsx** — LISTEN prompt. Fades out on first interaction. Never returns.

### Hooks

- **useSceneState.ts** — Central state. bgIndex, mgIndex, fgIndex, cursorX, cursorY, scrollOffset, advance().

## Page Composition

```tsx
<SkyCanvas scrollOffset={scene.scrollOffset} />
<CloudCanvas scrollOffset={scene.scrollOffset} mgIndex={scene.mgIndex} />
<TerrainCanvas scrollOffset={scene.scrollOffset} bgIndex={scene.bgIndex} />
<SunCanvas />
<AudioEngine cursorX={scene.cursorX} cursorY={scene.cursorY} />
<InteractionLayer ... />
<EntryScreen />
```

## Visual Language Rules

> Absolute. Never deviate.

- **One scene. One world.** Not a slideshow. One RMA world that breathes.
- **Color palette: void #000000–#080000, dark crimson #0a0000–#1e0000, mid red #2a0000–#5a0000, bright red #8b0000–#cc2200. Nothing else. No blues. No purples.**
- **The black sun: always pure #000000.** Center 50% x, 38% y. Radius 26% canvas height.
- **Terrain: dark with geological texture. NOT flat black.** Multi-scale noise, light variation, atmospheric depth.
- **Grain: heavy and warm rgba(255,180,160,x).** Clearly visible. The unifier of all layers.
- **Everything breathes.** Every layer has its own slow animation timescale.
- **No Z-axis zoom. No scale transforms on scroll. Parallax translation only.**

## Audio Architecture — The Black Sun as Instrument

The black sun at the center of the screen is the control surface for the entire audio system. The visitor's cursor position relative to the sun — its distance, angle, and movement — controls all sound parameters simultaneously. This is discovered gradually. No UI. No instructions.

### Sun Coordinates (used by both AudioEngine and InteractionLayer)

```js
sunCx = window.innerWidth * 0.5
sunCy = window.innerHeight * 0.38
sunRadius = window.innerHeight * 0.26
```

### The Four Parameters (all computed from each mousemove)

**Parameter 1 — Distance → Filter Cutoff**
```js
const dx = cursor.x - sunCx
const dy = cursor.y - sunCy
const distance = Math.sqrt(dx*dx + dy*dy)
const maxDist = Math.sqrt(Math.pow(window.innerWidth,2)+Math.pow(window.innerHeight,2)) * 0.5
const norm = Math.min(distance / maxDist, 1)
const targetHz = 300 + (norm * 8700)
filter.frequency.linearRampToValueAtTime(targetHz, ctx.currentTime + 0.08)
```
- At sun center: 300Hz — dark, muffled, submerged, intimate
- At screen edge: 9000Hz — bright, open, full frequency range

**Parameter 2 — Angle → Reverb Wet/Dry**
```js
const angle = Math.atan2(dy, dx) // -PI to PI
const normAngle = (angle + Math.PI) / (Math.PI * 2) // 0 to 1
wetGain.gain.value = normAngle
dryGain.gain.value = 1 - normAngle
```
- Cursor directly above sun (angle -PI/2): driest — intimate, present, close
- Cursor directly below sun (angle PI/2): wettest — vast, oceanic, infinite
- Full clockwise orbit: a complete emotional arc

**Parameter 3 — Rotation Speed → Master Volume**
```js
const angleDelta = angle - prevAngle
const normDelta = ((angleDelta + Math.PI) % (Math.PI*2)) - Math.PI
rotationAcc.current += normDelta * 0.3
rotationAcc.current *= 0.95 // decay
const volTarget = Math.max(0, Math.min(1, masterVol.current + rotationAcc.current * 0.01))
masterGain.gain.linearRampToValueAtTime(volTarget, ctx.currentTime + 0.1)
```
- Orbiting clockwise: volume rises slowly
- Orbiting counterclockwise: volume fades slowly
- Default volume: 0.85. Range: 0.0 to 1.0.

**Parameter 4 — Movement Speed → Stem Group Mix**
```js
const speed = Math.sqrt(Math.pow(cx-px,2)+Math.pow(cy-py,2))
const normSpeed = Math.min(speed/50, 1)
smoothSpeed.current = smoothSpeed.current*0.9 + normSpeed*0.1
lowGain.gain.value = 0.6 + (1-smoothSpeed.current)*0.4
highGain.gain.value = 0.4 + smoothSpeed.current*0.6
```
- Still or drifting slowly: low drone prominent, meditative
- Moving quickly: high texture prominent, energetic

### Signal Chain

```
AudioBufferSourceNodes (one per active stem per group)
↓
GainNodes (per stem — for crossfading)
↓
GroupGainNodes (low / mid / high — speed-controlled mix)
↓
MasterGainNode (default 0.85 — rotation-controlled)
↓
BiquadFilterNode (lowpass Q:0.8 — distance-controlled)
↓
DryGain ─────────────────────────────────→ Destination
WetGain → ConvolverNode (angle-controlled) → Destination
```

### Stem File Organization

```
public/audio/
  low-01.mp3 ... low-12.mp3    bass, sub, drone
  mid-01.mp3 ... mid-12.mp3    pads, harmonic texture
  high-01.mp3 ... high-12.mp3  sound design, texture
```

### Shuffled Playlist System

Fisher-Yates shuffle each group independently at session start. Play through sequence. Each stem plays to completion then crossfades to the next. All three groups run on independent timing — never synchronized.

```js
function fisherYates(arr) {
  const a = [...arr]
  for(let i=a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1))
    ;[a[i],a[j]] = [a[j],a[i]]
  }
  return a
}
```

### Crossfade Timing

- Low group: full duration then 25-second crossfade
- Mid group: full duration then 30-second crossfade
- High group: full duration then 20-second crossfade
- All stems start at random offset — music sounds already in progress on arrival

### Audio Start Behavior

AudioContext starts on first user gesture via `rma-audio-start` custom event fired by InteractionLayer on first scroll or click. Never autoplay. Never start AudioContext outside a user gesture handler.

### Error Handling

All audio loading uses try/catch, returns null on failure. Missing files skipped silently. Experience works completely with empty public/audio/ folder. No console.log statements anywhere.

## Parallax System

`scrollOffset` in useSceneState. Increments on wheel by `deltaY * 0.15`. Decays each frame by `0.88`. Cap +/-90. Resets smoothly to 0 on scene change.

- SkyCanvas: `CSS translateY(scrollOffset * 0.015 + "px")`
- CloudCanvas: `CSS translateY(scrollOffset * 0.06 + "px")`
- TerrainCanvas: `CSS translateY(scrollOffset * 0.18 + "px")`
- SunCanvas: no transform. Ever.

## Scene System

- bgIndex (0–2), mgIndex (0–3), fgIndex (0–2). All advance via `advance()`. 900ms debounce.
- On scene change: SkyCanvas, CloudCanvas, TerrainCanvas fade CSS opacity 1→0 over 900ms, regenerate with new seed, fade 0→1.
- SunCanvas opacity is always 1. Never changes under any circumstance.
- scrollOffset resets smoothly to 0 on scene change.

## Layer Specifications

### Layer 1 — SkyCanvas (z-index 1)

Draws in this order each frame:

**Sky Gradient:** Top: #000000 | 35%: #040000 | 65%: #0e0000 | 85%: #1e0000 | Bottom: #150000

**Stars:** 200 stars in useRef. Each: x/y (0-1), radius (0.4-1.8px), twinkleSpeed (0.15-0.7hz), twinkleOffset (0-2pi), baseOpacity (0.3-0.9). Frame opacity: `baseOpacity * ((sin(t*speed*0.001+offset)+1)/2*0.6+0.4)`. Colors: 80% warm white rgba(255,210,190,op), 20% red-tinted rgba(255,100,80,op). Canvas rotates imperceptibly: CSS transform rotate(), delta * 0.000003 degrees per ms.

**Milky Way:** 40 radial gradients along diagonal (15%,20%) to (85%,60%). Each: 80px radius, rgba(160,40,30,0.06) center, transparent edge. Path drifts +/-2% on 90-second sine. Barely visible — discovered not obvious.

**Sun Corona:** Radial gradients at (canvas.width*0.5, canvas.height*0.38). Pulses on 15-second sine: multiply by (0.75 + 0.25 * sin(timestamp * 0.00007)).
- Inner: transparent 0 to radius*0.27
- Mid glow: rgba(200,30,0,0.3) at radius*1.05, transparent at radius*1.7
- Outer halo: rgba(120,15,0,0.15) at radius*1.7, transparent at radius*3.0

**Sky Grain:** 6000 pixels/frame. rgba(255,180,160, rand*0.03+0.01).

**Parallax:** CSS translateY(scrollOffset * 0.015 + "px").

### Layer 2 — CloudCanvas (z-index 2)

Turbulent red formations. Upper 75% of canvas only — fade to transparent at horizon. Seed = mgIndex.

**Cloud Noise Function:**
```js
function cloudNoise(x, y, t, seed) {
  let v=0, amp=1, freq=1
  for(let i=0; i<5; i++) {
    v += Math.sin(x*freq*0.004+seed*6.3+t*0.00018*freq)
       * Math.cos(y*freq*0.005+seed*4.1+t*0.00013*freq) * amp
    amp*=0.48; freq*=2.2
  }
  return (v+1.8)/3.6
}
```

Sample every 4px. fillRect(x,y,4,4). Time += 0.25/frame.

Thresholds:
- 0.00–0.35: transparent void
- 0.35–0.52: rgba(20,0,0,0.55) deep shadow
- 0.52–0.65: rgba(70,4,0,0.65) cloud body
- 0.65–0.78: rgba(130,12,0,0.72) mid bright
- 0.78–0.88: rgba(180,22,0,0.78) bright
- 0.88–1.00: rgba(210,35,0,0.82) highlight

**Cloud Grain:** 10000 pixels/frame. rgba(255,180,160, rand*0.04+0.02).

**Parallax:** CSS translateY(scrollOffset * 0.06 + "px").

### Layer 3 — TerrainCanvas (z-index 3)

Dark geological landscape. surfaceNoise modulates terrain color per-pixel. Biome determined by bgIndex.

**Core Functions:**
```js
function sr(seed,i){const x=Math.sin(seed*9301+i*49297+233)*10000;return x-Math.floor(x)}
function ridgeLine(x,seed,baseY,amp,freq) {
  return baseY+Math.sin(x*freq+seed*4.2)*amp
        +Math.sin(x*freq*2.7+seed*7.1)*amp*0.4
        +Math.sin(x*freq*6.3+seed*2.8)*amp*0.15
        +Math.sin(x*freq*13.1+seed*9.4)*amp*0.07
}
function surfaceNoise(x,y,seed) {
  return Math.sin(x*0.08+seed*3.1)*Math.cos(y*0.06+seed*7.3)*0.5
        +Math.sin(x*0.23+seed*5.7)*Math.cos(y*0.19+seed*2.1)*0.3
        +Math.sin(x*0.71+seed*1.9)*Math.cos(y*0.67+seed*8.4)*0.2
}
```

surfaceNoise modulates terrain color per-pixel. Positive = warmer/lighter. Negative = deeper shadow.

**Terrain Color Ranges:**
- Base fill: #0d0000 to #1e0000
- Light-facing surfaces: #200400 to #3d0800
- Deep shadow / crevices: #050000 to #080000
- Atmospheric edge glow: rgba(140,30,0,0.3)

**Biome 0 — Rocky Mountains:** Ridge 68-72% height, amplitude canvas.height*0.12, freq 0.003. 3-5 rock spires. Geological layering via surfaceNoise.

**Biome 1 — Desert Dunes:** Ridge 72-76%, amplitude canvas.height*0.10, freq 0.0015. Smooth dune profiles. 4-6 saguaro cacti.

**Biome 2 — Rocky Badlands:** Flat plateau 74-78% with cliff drops. Mesa formations. Scattered boulders. Cracked surface texture.

**All Biomes:** Atmospheric edge glow rgba(140,30,0,0.3), horizon haze, terrain grain 12000px/frame rgba(255,170,150, rand*0.05+0.025), breath opacity 0.95-1.0 on 40-second cycle.

**Parallax:** CSS translateY(scrollOffset * 0.18 + "px").

### Layer 4 — SunCanvas (z-index 4)

One canvas. One thing. Drawn once on mount and on resize only. No RAF loop.

```
cx = canvas.width * 0.5
cy = canvas.height * 0.38
radius = canvas.height * 0.26
fill = #000000
```

**No animation. No transition. No parallax. No opacity change. The permanent anchor.**

## Animation Timescales

- Cloud drift: time += 0.25 per frame
- Star twinkle: 0.15-0.7hz unique per star
- Star field rotation: delta * 0.000003 deg/ms
- Corona pulse: 15-second cycle
- Milky Way drift: 90-second cycle
- Terrain breath: 40-second cycle
- Grain: every frame

## Absolute Coding Rules

> No exceptions.

- **No npm installs.** No new dependencies. Use only what exists in the project.
- **No SSR for canvas or audio.** All browser API code inside useEffect with "use client".
- **No visible UI ever.** No text, labels, loading states shown to user.
- **No hard cuts.** All transitions use opacity crossfades.
- **requestAnimationFrame only for animation.** Never setInterval for visuals.
- **Audio starts only on first user gesture.** Never autoplay.
- **The black sun never moves, never fades, never transitions. Absolute.**
- **No console.log statements in any file.**

## Never Touch These Files

- package.json
- next.config.ts
- tsconfig.json
- tailwind.config.ts
- postcss.config.mjs
- eslint.config.mjs

## Audio Asset Specs

- Format: MP3 320kbps or OGG Vorbis q8
- Sample rate: 44.1kHz stereo
- All loops trimmed to exact bar boundaries
- Start and end with brief silence/fade — no click at loop point
- All harmonically compatible — D and related modes
- Naming: low-01.mp3, mid-02.mp3, high-03.mp3 etc.
- Location: public/audio/

## Success Criteria

- localhost:3003 shows the RMA world within 1 second. Zero visible UI.
- Black sun centered, large, never moves under any circumstance.
- Parallax depth clearly visible between sky, clouds, and terrain on scroll.
- Moving cursor toward sun darkens and closes the audio filter.
- Orbiting sun top-to-bottom changes reverb from dry to vast.
- Orbiting sun clockwise slowly raises volume.
- Everything breathes and animates. Nothing is static.
- Zero console errors. Works with empty public/audio/ folder.

## Dev Workflow

- Dev server runs on port 3003: `npm run dev`
- Deployed via Vercel on push to main
- Build with `npm run build` before pushing to catch SSR errors
- The experience should work completely with an empty public/audio/ folder

## Explicitly Out of Scope (Until Core Is Polished)

- Video foreground layers (WebM alpha)
- Processed photographic terrain textures
- Phase 4 mood system (scroll shifts color temperature)
- Canyon impulse response reverb IR
- LFO on filter, ping-pong delay
- Inactivity events (shooting star, aurora)
- Mobile / touch support
- Time-of-day awareness
- Collaborative presence
- Pinch-to-zoom gesture
