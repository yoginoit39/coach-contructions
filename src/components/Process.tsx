"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Btn, Label } from "./ui";

const ProcessScene = dynamic(() => import("./ProcessScene"), { ssr: false });
const noop = () => () => {};
const yes = () => true;
const no = () => false;

const STEPS = [
  { t: "Brief & site visit", w: "Week 01", d: "We listen, walk the plot and agree a budget range before any drawing starts." },
  { t: "Design", w: "Weeks 02–06", d: "Concept, 2D and 3D drawings, structural coordination. You see it before it exists." },
  { t: "Approvals & costing", w: "Weeks 06–10", d: "The set goes through the council. You get an itemised bill of quantities." },
  { t: "Build", w: "Week 10 on", d: "Our own site team, quality materials, a safe site. Weekly programme and photos." },
  { t: "Supervision", w: "Throughout", d: "Inspections and quality assurance at every stage, signed off level by level." },
  { t: "Handover", w: "Final week", d: "Walk-through, snag list cleared, as-built drawings and warranties in your hand." },
];

/**
 * The programme: six steps on the left, a small wireframe house on the right
 * that goes up as you scroll through them. The canvas is sticky; the step
 * list scrolls past it and drives the build.
 */
export default function Process() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [active, setActive] = useState(false);
  const mounted = useSyncExternalStore(noop, yes, no);

  useEffect(() => {
    const el = ref.current!;
    const list = el.querySelector<HTMLElement>("[data-list]")!;
    const st = ScrollTrigger.create({
      trigger: list,
      start: "top 70%",
      end: "bottom 50%",
      onUpdate: (s) => (progress.current = s.progress),
    });
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "10% 0px" });
    io.observe(el);
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-step]").forEach((s) => {
        gsap.from(s, { x: 24, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 85%", once: true } });
        gsap.to(s, { "--on": 1, duration: 0.5, ease: "power2.out", scrollTrigger: { trigger: s, start: "top 62%", end: "bottom 38%", toggleActions: "play reverse play reverse" } });
      });
    }, el);
    return () => {
      st.kill();
      io.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section ref={ref} id="process" className="px-[var(--pad)] py-20 md:py-32">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <Label>03 · Programme</Label>
          <h2 className="display mt-3 text-[12vw] leading-[0.88] md:text-[6.5rem]">
            Six steps, <em>every site.</em>
          </h2>
        </div>
        <p className="text-[0.95rem] leading-relaxed text-muted md:col-span-4 md:pb-3">
          Same programme on a two-bedroom house and on a seven-storey block. Clear communication at every step, strict safety on site, full compliance with Ugandan regulations.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-10 md:mt-16 md:grid-cols-12 md:items-stretch md:gap-8">
        {/* sticky house */}
        <div className="order-first md:order-last md:col-span-6 md:self-stretch">
          <div className="sheet sticky top-20 aspect-[4/3] border border-line md:top-[5.5rem]">
            {mounted && <ProcessScene progress={progress} active={active} />}
            <span className="mono absolute left-3 top-3 text-ghost">Pool Villa · Wakiso · wireframe</span>
            <span className="mono absolute bottom-3 right-3 text-faint">Scroll the steps</span>
          </div>
        </div>

        {/* steps */}
        <ol data-list className="w-full min-w-0 max-w-full md:col-span-6">
          {STEPS.map((s, i) => (
            <li key={s.t} data-step style={{ ["--on" as string]: 0 }} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 border-t border-line py-7 md:grid-cols-[5rem_minmax(0,1fr)] md:gap-4 md:py-9 last:border-b">
              <span className="display hollow whitespace-nowrap text-[2.4rem] leading-none text-ink [opacity:calc(0.35+0.65*var(--on))] md:text-[3.4rem]">0{i + 1}</span>
              <div>
                <h3 className="display text-[1.35rem] leading-[0.95] md:text-[2.2rem] [opacity:calc(0.55+0.45*var(--on))]" style={{ overflowWrap: "anywhere" }}>{s.t}</h3>
                <span className="mono mt-1.5 block text-accent [opacity:calc(0.5+0.5*var(--on))]">{s.w}</span>
                <p className="mt-3 max-w-md text-[0.9rem] leading-relaxed text-muted [opacity:calc(0.5+0.5*var(--on))] md:text-[0.95rem]" style={{ overflowWrap: "anywhere" }}>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-6">
        <Btn href="/#contact">Book a site visit</Btn>
        <span className="mono text-faint">Usually within one working day</span>
      </div>
    </section>
  );
}
