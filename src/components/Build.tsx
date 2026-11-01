"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { intro } from "@/lib/intro";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const MQ = "(max-width: 767px), (pointer: coarse)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const getLite = () => window.matchMedia(MQ).matches;
const getServerLite = () => false;
// mount the canvas once, on the client, so the phone/desktop config never flips mid-life
const noop = () => () => {};
const getMounted = () => true;
const getServerMounted = () => false;

const STAGES = [
  { n: "00", t: "Survey", d: "Six Coach sites on one plot. We walk each one, peg it out and agree a budget range before any drawing." },
  { n: "01", t: "Foundations", d: "Slabs cast for apartments, offices, townhouses, a food court and a villa. Approvals through the council." },
  { n: "02", t: "Structure", d: "Columns, slabs and walls, floor by floor. Two cranes, our own crews, weekly programme." },
  { n: "03", t: "Skyline", d: "Roofs, balconies, canopies and the villa's pool terrace. Inspections signed off level by level." },
  { n: "04", t: "Lights on", d: "Glazing in. Power on, block by block. Keys handed over across Kampala, Wakiso and beyond." },
];

/**
 * The 3D build chapter. A tall section with a sticky canvas; scroll progress
 * drives the building's assembly and the HUD copy.
 */
export default function Build() {
  const ref = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });
  const lite = useSyncExternalStore(subscribe, getLite, getServerLite);
  const mounted = useSyncExternalStore(noop, getMounted, getServerMounted);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = ref.current!;
    const pct = el.querySelector<HTMLElement>("[data-pct]")!;
    const bar = el.querySelector<HTMLElement>("[data-bar]")!;
    const stages = el.querySelectorAll<HTMLElement>("[data-stage]");
    const title = el.querySelector("[data-title]")!;

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        progress.current = self.progress;
        pct.textContent = String(Math.round(self.progress * 100)).padStart(3, "0");
        gsap.set(bar, { scaleX: self.progress });
      },
    });

    const ctx = gsap.context(() => {
      // HUD stage copy crossfade, scrubbed
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.4 } });
      const n = stages.length;
      stages.forEach((s, i) => {
        const a = i / n;
        const b = (i + 1) / n;
        tl.fromTo(s, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.08, ease: "none" }, a + 0.02);
        if (i < n - 1) tl.to(s, { opacity: 0, y: -16, duration: 0.06, ease: "none" }, b - 0.06);
      });
      tl.to(title, { opacity: 0, y: -30, duration: 0.12, ease: "none" }, 0.06);
      tl.to(el.querySelector("[data-hint]"), { opacity: 0, duration: 0.06, ease: "none" }, 0.04);
      // intro: title lines
      gsap.set(title.querySelectorAll("[data-line]"), { yPercent: 110 });
      gsap.set(el.querySelectorAll("[data-ui]"), { opacity: 0 });
    }, el);

    const off = intro.onDone(() => {
      gsap.to(title.querySelectorAll("[data-line]"), { yPercent: 0, duration: 1.3, ease: "expo.out", stagger: 0.1, delay: 0.2 });
      gsap.to(el.querySelectorAll("[data-ui]"), { opacity: 1, duration: 1, delay: 0.8, stagger: 0.05 });
    });

    // stop rendering the canvas once it has scrolled out of view
    const io = new IntersectionObserver(([en]) => setActive(en.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(el);
    const move = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      off();
      st.kill();
      ctx.revert();
      window.removeEventListener("pointermove", move);
      io.disconnect();
    };
  }, []);

  return (
    <section ref={ref} id="top" className="dark relative h-[520vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          {mounted && <Scene progress={progress} mouse={mouse} lite={lite} active={active} />}
        </div>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-0">
          {/* opening title */}
          <div data-title className="absolute left-5 top-24 md:left-8 md:top-28">
            <h1 className="display text-[13vw] md:text-[6.4vw]">
              <span className="block overflow-hidden">
                <span data-line className="block">
                  Coach builds
                </span>
              </span>
              <span className="block overflow-hidden">
                <span data-line className="block text-accent">
                  Uganda.
                </span>
              </span>
            </h1>
            <p className="mono mt-6 max-w-xs text-muted" data-ui>
              Coach Construction &amp; Design, Kampala. Scroll to break ground and draw the skyline.
            </p>
          </div>

          {/* stage copy */}
          <div className="absolute bottom-20 left-5 w-[min(34rem,calc(100vw-2.5rem))] md:bottom-28 md:left-8">
            {STAGES.map((s) => (
              <div key={s.n} data-stage className="absolute bottom-0 left-0 opacity-0">
                {/* scrim so the copy stays readable over the wireframes */}
                <span aria-hidden className="scrim pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 md:-inset-x-16 md:-inset-y-20" />
                <div className="mono flex items-center gap-3 text-accent">
                  <span>{s.n}</span>
                  <span className="h-px w-8 bg-accent" />
                  <span>Stage</span>
                </div>
                <h2 className="display mt-3 text-[11vw] [overflow-wrap:normal] md:text-[5rem]">{s.t}</h2>
                <p className="mt-3 max-w-sm text-[0.9rem] leading-relaxed text-muted md:mt-4 md:text-[1.02rem]">{s.d}</p>
              </div>
            ))}
          </div>

          {/* right HUD */}
          <div className="mono absolute right-5 top-24 hidden flex-col items-end gap-1 text-right text-faint md:right-8 md:top-28 md:flex" data-ui>
            <span>0°18′49″N 32°34′52″E</span>
            <span>Kampala · Wakiso · Masaka</span>
            <span>6 sites · 2 cranes · 150+ projects</span>
          </div>
          <div className="absolute bottom-6 right-5 flex items-center gap-4 md:bottom-8 md:right-8" data-ui>
            <span className="mono text-faint">Build</span>
            <span className="relative block h-px w-32 bg-line-strong">
              <span data-bar className="absolute inset-0 origin-left scale-x-0 bg-accent" />
            </span>
            <span className="display text-2xl tabular-nums">
              <span data-pct>000</span>%
            </span>
          </div>
          <div className="absolute bottom-[4.5rem] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-7" data-ui data-hint>
            <span className="mono text-accent">Scroll to build</span>
            <span className="relative block h-9 w-5 rounded-full border border-accent/70">
              <span className="absolute left-1/2 top-1.5 h-2 w-0.5 -translate-x-1/2 rounded-full bg-accent wheel" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
