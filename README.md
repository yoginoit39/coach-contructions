# Coach Construction & Design

Marketing site for Coach Construction & Design, a design-build firm. Built with Next.js 16 (App Router), Tailwind CSS 4, GSAP (ScrollTrigger, SplitText, DrawSVG), Lenis smooth scroll and Geist fonts.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Structure

- `src/app/page.tsx` composes the sections in order.
- `src/components/` one file per section: `Preloader`, `Header`, `Hero` (+ `HeroCanvas` drag-select), `IntroBand`, `Partners`, `Problems`, `Story` (pinned scroll story), `Capabilities`, `WhyUs`, `UseCases`, `FinalCta`, `Newsletter`, `Footer`, `CookieBanner`.
- `src/components/SmoothScroll.tsx` Lenis + ScrollTrigger sync. `Cursor.tsx` custom crosshair cursor (desktop only). `SplitReveal.tsx` masked line reveal for headings.
- `src/components/art.tsx` line-art SVGs (house elevation, floor plan, wire tower, isometric icons) drawn with DrawSVG.
- `src/lib/gsap.ts` registers plugins. `src/lib/intro.ts` lets sections wait for the preloader to finish.
- `src/components/ui.tsx` shared primitives: `Button`, `Section`, `Frame` (ruler ticks + corner marks), `Label`, `Logo`.
- `src/lib/images.ts` feature image map and `src/lib/projects.ts` gallery data. Images live in `public/img/projects` (renders + site photos, 16 projects) and `public/img/site` (team on site), resized ≤1400px, JPEG q62.
- `src/app/globals.css` design tokens (`--bg`, `--primary`, `--brand`, `--border`) and utility classes (`.display`, `.mono`, `.img-bw`).

## Customising

- Copy, addresses, phone and email live inline in each section component and in `Footer.tsx`.
- Brand colour is `--brand` in `globals.css`.
- The preloader runs once per browser session (`sessionStorage`). Remove `<Preloader />` from `page.tsx` to disable it.
- Animations are GSAP timelines inside each section component; the pinned story is in `Story.tsx` (desktop only, static on mobile).
- Newsletter form is client-side only. Wire `Newsletter.tsx` to an email provider or a Server Action to collect addresses.

## Current design (Oct 2026): VEA-style monochrome

Reference: virtuallyeverafter.xyz. Deep green-black `#0c1413` (from the logo's teal), bone ink `#E9E7E2`, accent = the logo's olive green `#9ab53c` (labels, build bar, hero second line, marquee, selection, button hover, crane, survey pegs, scan line). One typeface (IBM Plex Mono), hollow-stroke glyphs for emphasis (`.hollow`, or `<em>` inside `.display`), hairline borders. `public/img/logo-mark.png` is the real logo with its background knocked out, used in the menu overlay and footer. The 3D build chapter, gate, marquee, scattered gallery, pinned services strip and masonry index are kept from the previous round, restyled.

- Hero opens on **Uganda in terracotta bricks** (`Letters` in `Scene.tsx`: real border from `src/lib/uganda-outline.json`, land filled with one InstancedMesh of bricks, Lake Victoria cut out as a low water-blue slab, green border line, pulsing pin on Kampala). Scrolling 2–16% lifts the bricks off starting from Kampala outward, the lake drains, and the skyline rises where the capital was. A **tower crane** (`Crane`, the company logo is a crane) rises at 5–16% then slews across the site with a trolley and lowering hook for the rest of the build.
- `Scene.tsx` builds a **six-site Kampala skyline** (`City`: Crescent Apartments stepped tower, Mukwano brick offices with canopy, 7-floor apartment tower with balconies, KURB food court row with canopy and sign, four gabled townhouses, plus the Pool Villa at half scale) with two logo-green tower cranes. Native scrolling (Lenis removed; `scrollLock` in `src/lib/scroll-lock.ts` freezes the page for the gate and menu). No custom cursor. The skyline, villa and cranes are **wireframe only** (`Piece` draws `Edges` over a depth-only fill with `colorWrite: false` + polygon offset, so lines behind a building are hidden: a hidden-line drawing, not see-through; wide windows are split into mullioned panes); windows become warm filled panes during the lights-on finale (`finale` clock in `Scene.tsx`: blackout, flicker on in order left→right, crane hook lamps blink, camera dollies in). The canvas stops rendering (`frameloop="never"`) once the build section scrolls out of view; no post-processing anywhere; 1K shadow maps; 512px reflector. Phones additionally get a `lite` scene (lower dpr, no antialias, 256px reflector, fewer dust points), a portrait-aware camera that backs off and scales the fog, and native touch scrolling (Lenis `syncTouch: false`).
- The Pool Villa (`Villa`) is still built procedurally: foundations, stone plinths, rendered walls, seven verandah columns, first-floor slab, balcony rail, cornice, custom hip-roof BufferGeometry (`hipRoof()`) on the house / garage wing / porch / cupola, 14 glazing panes, amphitheatre half-ring steps and the pool basin. Each `Piece` flies in from a deterministic exploded offset with rotation, wireframe edges first then solid. Extras: scan plane sweeping up with build height, 900-point dust field, rising pool water with `MeshReflectorMaterial`, warm emissive windows at 90–100%, real directional shadows, Bloom + Vignette via `@react-three/postprocessing`. Camera orbits from a back-left survey view to a low front view over the pool and leans with the pointer.
- Project pages: `/work/[slug]` (`src/app/work/[slug]/page.tsx`). Full-screen `WorkStage.tsx` media track (horizontal snap, keyboard arrows, click to advance, thumbnails, outlined title HUD), then info header with meta list and brief, full media grid, prev/next. `IntroDone.tsx` skips the gate on inner pages. `export const instant = false` because the page reads `params`.
- Index and gallery tiles now link to project pages. The lightbox component is gone.
- Dev notes: do not name a custom class `.outline` (collides with the Tailwind utility). Custom classes that set `position` go in `@layer components`. Never run `next build` while `next dev` runs. Restart dev after large `globals.css` rewrites.
