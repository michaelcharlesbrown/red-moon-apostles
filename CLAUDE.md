# CLAUDE.md — MCB Motion Lab

## Project Overview

Animation reference library built with Next.js 16 (App Router), React 19, TypeScript 5, GSAP 3.14, Framer Motion, and Tailwind CSS v4.

## Quick Start

```bash
npm install
npm run dev      # starts on port 3003
npm run build    # production build
npm run lint     # ESLint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (Geist fonts)
│   ├── page.tsx             # Home page (boilerplate — not customized)
│   ├── globals.css          # Global styles + Tailwind v4
│   └── lab/                 # All experiment pages
│       ├── page.tsx         # Hub — 3 sections: GSAP, Framer Motion, Advanced Effects
│       ├── 1/               # PageSplit + TextReveal
│       ├── 2/               # StaggerReveal
│       ├── typography/      # 6 text animation modes
│       ├── gsap/            # GSAP-focused experiments
│       │   ├── text-animations/
│       │   ├── scroll-effects/
│       │   └── timeline-sequences/
│       ├── framer-motion/   # Framer Motion experiments
│       │   ├── ui-animations/
│       │   ├── page-transitions/
│       │   └── layout-animations/
│       ├── grain/           # Grain overlays (3 approaches)
│       │   ├── generate/    # Canvas-based procedural grain
│       │   └── turbulence/  # SVG feTurbulence grain
│       └── transitions/     # Page transition system
│           ├── a/, b/       # Target pages for transition demos
│           └── rapid-layers/ # Image-based rapid layer animation
└── components/
    └── motion/              # All reusable animation components
        ├── index.ts         # Barrel: PageSplitOverlay, StaggerReveal, TextReveal
        ├── grain/           # FilmGrainOverlay, GrainOverlayCanvas, GrainTurbulenceOverlay
        ├── transitions/     # TransitionOverlay, RapidLayersTransition, context, hooks
        └── typography/      # TypeDemo (6 modes), SplitText utilities
```

## Key Conventions

- **Animation libraries:** GSAP for imperative/timeline/scroll work; Framer Motion for declarative React animations. GSAP animations use `gsap.context()` for scoped cleanup.
- **Accessibility:** Every animation component checks `prefers-reduced-motion` and gracefully degrades.
- **Imperative control:** Components expose animation triggers via `forwardRef` + `useImperativeHandle`.
- **Styling:** Tailwind CSS v4 + CSS Modules (`.module.css`) for scoped styles. No global Tailwind config file (v4 defaults).
- **Imports:** Use `@/` path alias (maps to `src/`). Components have barrel exports via `index.ts`.
- **TypeScript:** Strict mode enabled. Export types alongside components.
- **Port:** Dev and production servers run on port 3003.

## Component API Patterns

### Imperative animation components
Components like `PageSplitOverlay` and `RapidLayersTransition` use ref-based imperative handles:

```tsx
const ref = useRef<PageSplitOverlayHandle>(null);
ref.current?.open();   // trigger animation
ref.current?.close();
```

### Transition system
Wrap pages with `TransitionProvider` and use the navigation hook:

```tsx
const navigate = useNavigateWithTransition();
navigate("/lab/transitions/a");
```

Variants: `triple`, `simple`, `duo`, `content`.

### Typography
`TypeDemo` accepts a `mode` prop: `line-reveal`, `char-cascade`, `word-lift`, `scramble`, `typewriter`, `emphasis`.

## Known Issues

- `FilmGrainOverlay` and `GrainTurbulenceOverlay` are not exported from `grain/index.ts`.
- Root home page (`/`) is still the default Next.js boilerplate.

## Adding New Experiments

1. Create a new directory under `src/app/lab/<name>/` with a `page.tsx`.
2. Build reusable animation components in `src/components/motion/` (or a sub-folder).
3. Export from the relevant `index.ts` barrel file.
4. Add a link to the new experiment in `src/app/lab/page.tsx`.
5. For GSAP components, use `gsap.context()` for cleanup. For Framer Motion, use declarative `motion` components.
6. Always check `prefers-reduced-motion` and gracefully degrade.
