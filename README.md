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

- Hero opens on **Uganda in terracotta bricks** and the same bricks become the skyline (`Bricks` in `Scene.tsx`). Real border from `src/lib/uganda-outline.json`, land tiled by one InstancedMesh (~3,300 bricks; tiles nearest Kampala stack two high), Lake Victoria cut out as a water-blue slab, green border line, pulsing pin on Kampala. `layout()` lays every building out as brick cells (hollow walls, staggered courses, 1×2 window gaps, slab plates) with a build time per course; cells are sorted by time and paired with map tiles sorted by distance from Kampala, so the capital's bricks leave first and each building rises course by course. Each brick lerps map→wall with an arc and a tumble over 7% of scroll; matrices only re-pack when progress changes. Windows are a second additive InstancedMesh (`fog={false}`, else fog tints them) coloured black until the finale. Two logo-green wireframe **tower cranes** (`Crane`, the logo is a crane) rise at 5–16% then slew across the site with a trolley and lowering hook.
- Buildings on the plot: Crescent Apartments stepped tower, 7-floor apartment tower, Mukwano offices, KURB food court row, four townhouses and the Pool Villa with garage wing (pool water separate). Native scrolling (Lenis removed; `scrollLock` in `src/lib/scroll-lock.ts` freezes the page for the gate and menu). No custom cursor. Lights-on finale (`finale` clock in `Scene.tsx`): key light cuts, window panes flick on in order left→right, crane hook lamps blink, camera dollies in (gently on portrait). The canvas stops rendering (`frameloop="never"`) once the build section scrolls out of view; no post-processing, no shadows. Phones render at device pixel ratio up to 2 with antialias (lines were jagged at dpr 1), fewer dust points, and a portrait-aware camera that backs off and scales the fog.
- `Villa` + `Piece` (hidden-line wireframe: `Edges` over a depth-only fill with `colorWrite: false` + polygon offset) remain in `Scene.tsx` for the Programme section's `ProcessScene`, which draws the Pool Villa piece by piece as the six steps light up.
- Project pages: `/work/[slug]` (`src/app/work/[slug]/page.tsx`). Full-screen `WorkStage.tsx` media track (horizontal snap, keyboard arrows, click to advance, thumbnails, outlined title HUD), then info header with meta list and brief, full media grid, prev/next. `IntroDone.tsx` skips the gate on inner pages. `export const instant = false` because the page reads `params`.
- Index and gallery tiles now link to project pages. The lightbox component is gone.
- Dev notes: do not name a custom class `.outline` (collides with the Tailwind utility). Custom classes that set `position` go in `@layer components`. Never run `next build` while `next dev` runs. Restart dev after large `globals.css` rewrites.
