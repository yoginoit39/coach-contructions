"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { img } from "@/lib/images";
import Reveal from "./Reveal";

const STATS = [
  { n: 150, s: "+", l: "Projects completed" },
  { n: 120, s: "+", l: "Happy clients" },
  { n: 25, s: "", l: "People on the team" },
  { n: 10, s: "+", l: "Years building" },
];

export default function Stats() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
        const o = { v: 0 };
        gsap.to(o, { v: Number(node.dataset.count), duration: 2, ease: "power3.out", scrollTrigger: { trigger: node, start: "top 85%", once: true }, onUpdate: () => (node.textContent = String(Math.round(o.v))) });
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={ref} className="dark sheet">
      <div className="relative h-[80svh] overflow-hidden">
        <div data-parallax="10" className="absolute inset-0 -top-[10%] h-[120%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.team} alt="Coach site team on an apartment build in Kampala" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#000] via-[#000]/30 to-[#000]/20" />
        <Reveal className="absolute inset-x-5 bottom-10 md:inset-x-8 md:bottom-14">
          <p className="mono text-accent" data-stagger>
            {"// 04 · Site office"}
          </p>
          <p className="display mt-4 max-w-5xl text-[10vw] leading-[0.9] md:text-[6rem]" data-lines>
            Our own architects, engineers and crew, <em>one set of drawings.</em>
          </p>
        </Reveal>
      </div>
      <Reveal className="grid border-y border-line px-5 md:grid-cols-4 md:px-8">
        {STATS.map((s, i) => (
          <div key={s.l} data-stagger className={`py-10 md:py-14 ${i ? "md:border-l md:border-line md:pl-8" : ""}`}>
            <div className="display text-[5.5rem] leading-none md:text-[7rem]">
              <span data-count={s.n}>0</span>
              <span className="text-accent">{s.s}</span>
            </div>
            <div className="mono mt-3 text-faint">{s.l}</div>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
