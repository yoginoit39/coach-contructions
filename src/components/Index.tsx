"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { CATEGORIES, categoryOf, projects, type Category } from "@/lib/projects";
import Reveal from "./Reveal";
import { Sketch, SheetTag } from "./Sketch";
import { Label } from "./ui";

/**
 * Projects as a swipeable rail: one big card per swipe on phones, two and a
 * bit on desktop. Snap scrolling, drag anywhere, arrows, live counter,
 * category filter. Each card links to its project page.
 */
export default function Index() {
  const [cat, setCat] = useState<Category>("All");
  const [i, setI] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const list = cat === "All" ? projects : projects.filter((p) => categoryOf(p) === cat);
  const n = list.length;

  // counter + image parallax follow the track
  useEffect(() => {
    const t = track.current!;
    const cards = Array.from(t.querySelectorAll<HTMLElement>("[data-card]"));
    const imgs = cards.map((c) => c.querySelector<HTMLElement>("[data-img]")!);
    let raf = 0;
    const update = () => {
      raf = 0;
      const w = cards[0]?.offsetWidth || 1;
      const gap = parseFloat(getComputedStyle(t).columnGap || "16");
      setI(Math.max(0, Math.min(n - 1, Math.round(t.scrollLeft / (w + gap)))));
      const mid = t.scrollLeft + t.clientWidth / 2;
      cards.forEach((c, k) => {
        const d = (c.offsetLeft + c.offsetWidth / 2 - mid) / t.clientWidth;
        imgs[k].style.transform = `translateX(${d * -12}%) scale(1.18)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    t.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      t.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n, cat]);

  // drag to scroll with a mouse
  useEffect(() => {
    const t = track.current!;
    let down = false;
    let moved = false;
    let x0 = 0;
    let s0 = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      moved = false;
      x0 = e.clientX;
      s0 = t.scrollLeft;
      t.style.scrollSnapType = "none";
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) moved = true;
      t.scrollLeft = s0 - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      t.style.scrollSnapType = "";
      if (moved) {
        const stop = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
        };
        t.addEventListener("click", stop, { capture: true, once: true });
        setTimeout(() => t.removeEventListener("click", stop, { capture: true }), 50);
      }
    };
    t.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      t.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // card entrance
  useEffect(() => {
    const t = track.current!;
    const ctx = gsap.context(() => {
      gsap.from(t.querySelectorAll("[data-card]"), { x: 60, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: t, start: "top 85%", once: true } });
    }, t);
    return () => ctx.revert();
  }, [cat]);

  const go = (k: number) => {
    const t = track.current!;
    const c = t.querySelectorAll<HTMLElement>("[data-card]")[Math.max(0, Math.min(n - 1, k))];
    if (c) t.scrollTo({ left: c.offsetLeft - parseFloat(getComputedStyle(t).paddingLeft || "0"), behavior: "smooth" });
  };

  return (
    <section id="work" className="py-24 md:py-36">
      <Reveal className="px-[var(--pad)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div data-stagger>
            <Label>05 · Work</Label>
            <span className="ml-4 hidden md:inline">
              <SheetTag n={5} />
            </span>
            <h2 className="display mt-3 text-[12vw] leading-[0.9] md:text-[6rem]">
              Every project, <em>in order.</em>
            </h2>
          </div>
          <div className="mono flex items-center gap-4 text-faint md:pb-3" data-stagger>
            <span className="text-ink">{String(i + 1).padStart(2, "0")}</span>
            <span className="relative block h-px w-24 bg-line-strong">
              <span className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500" style={{ width: `${((i + 1) / n) * 100}%` }} />
            </span>
            <span>{String(n).padStart(2, "0")}</span>
            <span className="ml-2 hidden gap-2 md:flex">
              <button onClick={() => go(i - 1)} className="grid h-9 w-9 place-items-center border border-line text-lg hover:bg-ink hover:text-bone" aria-label="Previous project" data-hover>
                ‹
              </button>
              <button onClick={() => go(i + 1)} className="grid h-9 w-9 place-items-center border border-line text-lg hover:bg-ink hover:text-bone" aria-label="Next project" data-hover>
                ›
              </button>
            </span>
          </div>
        </div>
        <div className="mt-8 flex gap-x-6 gap-y-2 overflow-x-auto whitespace-nowrap scrollbar-none" data-stagger>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                setCat(c);
                track.current?.scrollTo({ left: 0 });
              }}
              data-active={cat === c}
              className={`ul mono shrink-0 transition-colors ${cat === c ? "text-ink" : "text-faint hover:text-ink"}`}
              data-hover
            >
              {c} <span className="text-faint">{c === "All" ? projects.length : projects.filter((p) => categoryOf(p) === c).length}</span>
            </button>
          ))}
        </div>
      </Reveal>

      <div ref={track} className="snap-x mt-8 flex gap-4 overflow-x-auto px-[var(--pad)] pb-4 md:gap-5" data-cursor="Drag">
        {list.map((p, k) => (
          <Link
            key={p.slug}
            href={`/work/${p.slug}`}
            data-card
            draggable={false}
            className="group relative aspect-[4/5] w-[82vw] shrink-0 snap-start overflow-hidden bg-bone-2 text-left sm:w-[62vw] md:aspect-[16/10] md:w-[56vw] lg:w-[44vw]"
          >
            <div data-img className="absolute inset-0 will-change-transform">
              <Sketch src={p.images[0]} alt={p.title} className="h-full w-full" imgClassName="h-full w-full object-cover" eager={k < 2} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1413]/90 via-[#0c1413]/10 to-[#0c1413]/20" />
            <span className="display hollow absolute left-4 top-3 text-[4.5rem] leading-none text-[#E9E7E2] md:text-[6rem]">{String(k + 1).padStart(2, "0")}</span>
            <span className="mono absolute right-4 top-5 border border-[#E9E7E2]/40 px-2 py-1 text-[#E9E7E2]/80">{p.status}</span>
            <div className="absolute inset-x-4 bottom-4 md:inset-x-6 md:bottom-6">
              <span className="mono block text-[#E9E7E2]/70">
                {categoryOf(p)} · {p.location} · {p.images.length} img
              </span>
              <span className="display mt-2 block text-[2rem] leading-[0.95] text-[#E9E7E2] md:text-[2.8rem]">{p.title}</span>
              <span className="mono mt-3 inline-flex items-center gap-2 text-accent opacity-0 transition-opacity duration-500 group-hover:opacity-100">Open the set →</span>
            </div>
          </Link>
        ))}
        <div className="flex w-[60vw] shrink-0 snap-start flex-col justify-end border border-line p-5 md:w-[28vw] md:p-7">
          <p className="display text-[2rem] leading-[0.95] md:text-[2.6rem]">
            Yours <em>next.</em>
          </p>
          <Link href="/#contact" className="mono ul mt-6 inline-block text-accent" data-hover>
            Start a project →
          </Link>
        </div>
      </div>
      <p className="mono mt-4 px-[var(--pad)] text-ghost">Swipe sideways · tap a project to open its set</p>
    </section>
  );
}
