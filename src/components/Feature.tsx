"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { dms, placeFor } from "@/lib/places";
import { categoryOf, projects } from "@/lib/projects";
import { Sketch, SheetTag } from "./Sketch";
import { Label } from "./ui";

/** Three plots, three states: one handed over, one on site, one on the drawing board. */
const PICKS: { slug: string; state: string; line: string; img: number }[] = [
  { slug: "kurb-food-court", state: "Handed over", line: "From a render to a rooftop with string lights. Kiosks, terrace and all, open for the night crowd.", img: 1 },
  { slug: "pool-villa", state: "On site now", line: "Structure complete, the pool amphitheatre poured. Finishes under way in Wakiso.", img: 0 },
  { slug: "crescent-apartments", state: "On the drawing board", line: "A stepped tower wrapped around a pool court. Concept and 3D set with the client.", img: 0 },
];

export default function Feature() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-print]").forEach((s, i) => {
        gsap.from(s.querySelectorAll("[data-tag]"), { opacity: 0, y: 10, duration: 0.8, stagger: 0.08, delay: 0.5 + i * 0.1, scrollTrigger: { trigger: s, start: "top 85%", once: true } });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  const items = PICKS.map((k) => ({ ...k, p: projects.find((x) => x.slug === k.slug)! })).filter((x) => x.p);

  return (
    <section ref={ref} className="px-[var(--pad)] py-20 md:py-32">
      <div className="flex items-end justify-between gap-6">
        <div>
          <Label>01 · On the plot</Label>
          <h2 className="display mt-4 text-[12vw] leading-[0.88] md:text-[6.5rem]">
            Three plots, <em>three states.</em>
          </h2>
        </div>
        <div className="hidden flex-col items-end gap-2 md:flex">
          <SheetTag n={1} />
          <Link href="/#work" className="mono ul text-faint">
            All 16 projects ↓
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-6">
        {items.map(({ p, state, line, img }, i) => {
          const idx = projects.indexOf(p);
          const pl = placeFor(p.location, idx);
          return (
            <Link key={p.slug} href={`/work/${p.slug}`} data-print className={`group block ${i === 1 ? "md:mt-16" : i === 2 ? "md:mt-32" : ""}`}>
              <span data-pic className="sheet relative block overflow-visible border border-line bg-bone-2 p-1.5 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-1">
                <Sketch src={p.images[img] ?? p.images[0]} alt={p.title} className="aspect-[4/5]" imgClassName="aspect-[4/5] w-full object-cover" />
                <span className="dim -top-5 left-2 right-2 hidden md:flex">{[12.4, 18.0, 31.6][i]} m</span>
                <span className="dim -bottom-5 left-2 right-2 hidden md:flex">{[9.8, 8.4, 24.0][i]} m · {["ground + 1", "ground + 1", "ground + 7"][i]}</span>
                <span className="absolute -left-2 -top-2 grid h-5 w-5 place-items-center">
                  <span className="absolute inset-0 rounded-full border border-accent/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                <span className="mono absolute right-3 top-3 bg-[#0c1413]/85 px-1.5 py-0.5 text-[#E9E7E2]" data-tag>
                  C{String(idx + 1).padStart(2, "0")}
                </span>
                <span className="mono absolute bottom-3 left-3 bg-accent px-1.5 py-0.5 text-accent-ink" data-tag>
                  {state}
                </span>
              </span>
              <span className="mt-4 block" data-tag>
                <span className="display block text-[1.6rem] leading-[1] md:text-[2rem]">{p.title}</span>
                <span className="mono mt-2 block text-faint">
                  {categoryOf(p)} · {pl.name} · {dms(pl.lat, pl.lon)}
                </span>
              </span>
              <span className="mt-3 block max-w-[34ch] text-[0.95rem] leading-relaxed text-muted" data-tag>
                {line}
              </span>
              <span className="mono mt-4 inline-block text-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100">Open the set →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
