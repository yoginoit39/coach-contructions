"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { categoryOf, type Project } from "@/lib/projects";

/**
 * Full-screen media stage: horizontal snap track of every image in the set,
 * HUD with outlined title bottom-left, counter, prev/next and thumbnails.
 */
export default function WorkStage({ project, code }: { project: Project; code: string }) {
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  const [i, setI] = useState(0);
  const n = project.images.length;

  const go = (k: number) => {
    const t = track.current!;
    const idx = ((k % n) + n) % n;
    t.scrollTo({ left: idx * t.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const t = track.current!;
    const onScroll = () => setI(Math.round(t.scrollLeft / t.clientWidth));
    t.addEventListener("scroll", onScroll, { passive: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(Math.round(t.scrollLeft / t.clientWidth) + 1);
      if (e.key === "ArrowLeft") go(Math.round(t.scrollLeft / t.clientWidth) - 1);
    };
    window.addEventListener("keydown", key);
    const ctx = gsap.context(() => {
      gsap.from(root.current!.querySelectorAll("[data-in]"), { y: 14, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.06, delay: 0.2 });
      gsap.from(t.querySelectorAll("img")[0], { scale: 1.06, duration: 2, ease: "expo.out" });
    }, root);
    return () => {
      t.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", key);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section ref={root} className="relative h-[100dvh] bg-black text-ink">
      <div ref={track} className="snap-x flex h-full overflow-x-auto overflow-y-hidden">
        {project.images.map((src, k) => (
          <figure key={src} className="relative h-full w-full shrink-0" onClick={() => go(k + 1)} data-cursor="Next">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${project.title} ${k + 1}`} className="h-full w-full object-contain" loading={k ? "lazy" : "eager"} draggable={false} />
          </figure>
        ))}
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[var(--pad)] top-[76px] flex items-center gap-6 md:top-[66px]" data-in>
          <Link href="/#work" className="mono ul pointer-events-auto text-muted" data-hover>
            ← Works
          </Link>
          <span className="mono text-ghost">
            {categoryOf(project)} · {code}
          </span>
        </div>
        <div className="mono absolute right-[var(--pad)] top-[76px] tabular-nums text-muted md:top-[66px]" data-in>
          {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </div>

        <div className="absolute bottom-[88px] left-[var(--pad)] max-w-[min(430px,70vw)]" data-in>
          <h1 className="display hollow text-[clamp(1.4rem,4.2vw,3.5rem)] leading-[0.92]">{project.title}</h1>
          <p className="mt-2 max-w-[36ch] text-[12px] leading-[1.6] text-ink/85">{project.blurb}</p>
        </div>

        <div className="absolute bottom-[88px] right-[var(--pad)] flex items-center gap-3" data-in>
          <button onClick={() => go(i - 1)} className="pointer-events-auto grid h-10 w-10 place-items-center border border-line text-lg hover:bg-ink hover:text-black" aria-label="Previous" data-hover>
            ‹
          </button>
          <button onClick={() => go(i + 1)} className="pointer-events-auto grid h-10 w-10 place-items-center border border-line text-lg hover:bg-ink hover:text-black" aria-label="Next" data-hover>
            ›
          </button>
        </div>

        <div className="absolute inset-x-[var(--pad)] bottom-6 flex items-center justify-between gap-6" data-in>
          <div className="pointer-events-auto flex gap-1.5">
            {project.images.map((src, k) => (
              <button key={src} onClick={() => go(k)} className={`h-9 w-14 overflow-hidden transition-opacity ${k === i ? "opacity-100 ring-1 ring-ink" : "opacity-40 hover:opacity-80"}`} aria-label={`Image ${k + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <span className="mono hidden text-ghost md:block">Scroll sideways · ← → · click to advance</span>
        </div>
      </div>
    </section>
  );
}
