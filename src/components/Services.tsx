"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { img } from "@/lib/images";
import { Sketch } from "./Sketch";
import { Btn, Label } from "./ui";

const ITEMS = [
  { t: "Architectural design", d: "Concept, 2D and 3D drawings, structural coordination. We take the set through building approvals.", tags: "Concept · 3D views · Approval set", img: img.crescent },
  { t: "Building construction", d: "Homes, apartment complexes, commercial and institutional buildings, built by our own site team.", tags: "New build · Extension · Development", img: img.poolVillaSite },
  { t: "Renovation & remodeling", d: "Structural upgrades, interior remodeling and exterior improvements. Minimal disruption.", tags: "Structural · Interior · Exterior", img: img.builtTownhouses },
  { t: "Project management", d: "Quality control, budget control, contractor coordination and compliance, every week of the build.", tags: "Quality · Budget · Compliance", img: img.teamWalk },
  { t: "Interior & exterior finishing", d: "High-grade finishes, landscaping and external works. The details that make a building worth keeping.", tags: "Finishes · Landscaping · External", img: img.mediterranean },
];

/** Five full-image panels on a pinned horizontal track. Vertical stack on mobile. */
export default function Services() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const track = el.querySelector<HTMLElement>("[data-track]")!;
      const bar = el.querySelector<HTMLElement>("[data-bar]")!;
      const head = el.querySelector<HTMLElement>("[data-head]")!;
      const fit = () => el.style.setProperty("--head", `${head.offsetHeight + 24 + 24}px`);
      fit();
      window.addEventListener("resize", fit);
      const dist = () => track.scrollWidth - el.clientWidth;
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (s) => gsap.set(bar, { scaleX: s.progress }) },
      });
      el.querySelectorAll<HTMLElement>("[data-pimg]").forEach((im) => {
        gsap.fromTo(im, { xPercent: -10 }, { xPercent: 10, ease: "none", scrollTrigger: { trigger: im, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
      return () => window.removeEventListener("resize", fit);
    });
    return () => {
      mm.revert();
    };
  }, []);

  return (
    <section id="services" className="dark">
      <div ref={ref} className="relative overflow-hidden md:h-[100svh]">
        <div data-head className="flex items-end justify-between gap-6 px-5 pt-24 md:px-8 md:pt-20">
          <div>
            <Label>02 · Services</Label>
            <h2 className="display mt-3 text-[11vw] leading-[0.9] md:text-[clamp(2.4rem,4.6vw,4.6rem)] md:whitespace-nowrap">
              Five trades, <em>one site office.</em>
            </h2>
          </div>
          <div className="mono hidden items-center gap-4 text-faint md:flex">
            <span>Scroll</span>
            <span className="relative block h-px w-32 bg-line-strong">
              <span data-bar className="absolute inset-0 origin-left scale-x-0 bg-accent" />
            </span>
            <span>05</span>
          </div>
        </div>

        <div data-track className="mt-6 flex flex-col gap-4 px-5 pb-10 md:h-[calc(100svh-var(--head,13rem))] md:flex-row md:gap-5 md:px-8 md:pb-6 md:will-change-transform">
          {ITEMS.map((it, i) => (
            <article key={it.t} className="group relative aspect-[4/5] shrink-0 overflow-hidden md:aspect-auto md:h-full md:w-[46vw]">
              <div data-pimg className="absolute -inset-x-[12%] inset-y-0">
                <Sketch src={it.img} alt={it.t} className="h-full w-full" imgClassName="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/25 to-transparent" />
              <span className="display hollow absolute left-5 top-5 text-[5rem] leading-none md:text-[7rem]">0{i + 1}</span>
              <span className="mono absolute right-5 top-6 max-w-[10rem] text-right text-ink/70">{it.tags}</span>
              <div className="absolute inset-x-5 bottom-5 md:inset-x-7 md:bottom-7">
                <h3 className="display text-[2.4rem] leading-[0.9] md:text-[3.6rem]">{it.t}</h3>
                <p className="mt-3 max-w-md text-[0.98rem] leading-relaxed text-ink/75">{it.d}</p>
              </div>
            </article>
          ))}
          <article className="flex shrink-0 flex-col justify-end border border-line p-6 md:h-full md:w-[30vw] md:p-8">
            <p className="display text-[2.6rem] leading-[0.9] md:text-[3.6rem]">
              One team, <em>first sketch to the keys.</em>
            </p>
            <div className="mt-8">
              <Btn href="#contact">Start a project</Btn>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
