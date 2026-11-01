"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Two rows moving opposite ways: a serif italic whisper and a display shout. Speed reacts to scroll velocity. */
export default function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const rows = el.querySelectorAll<HTMLElement>("[data-row]");
    const loops = Array.from(rows).map((r, i) => gsap.fromTo(r, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, ease: "none", duration: 30 + i * 8, repeat: -1 }));
    const st = ScrollTrigger.create({
      onUpdate: (self) => {
        const v = Math.min(5, Math.abs(self.getVelocity()) / 400);
        loops.forEach((l) => l.timeScale(1 + v));
      },
    });
    const tick = () => loops.forEach((l) => l.timeScale(gsap.utils.interpolate(l.timeScale(), 1, 0.05)));
    gsap.ticker.add(tick);
    return () => {
      st.kill();
      loops.forEach((l) => l.kill());
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div ref={ref} className="dark overflow-hidden border-y border-line py-8 md:py-10" style={{ contain: "paint" }}>
      <div data-row className="display hollow flex w-max whitespace-nowrap text-[7vw] leading-none text-accent md:text-[4rem]">
        {Array.from({ length: 2 }).map((_, k) => (
          <span key={k} className="pr-12">
            We draw it · we approve it · we build it · we finish it ·{" "}
          </span>
        ))}
      </div>
      <div data-row className="display -mt-[0.1em] flex w-max whitespace-nowrap pb-[0.08em] text-[16vw] leading-[1] md:text-[10rem]">
        {Array.from({ length: 2 }).map((_, k) => (
          <span key={k} className="pr-16">
            Built in Kampala since 2014 ·{" "}
          </span>
        ))}
      </div>
    </div>
  );
}
