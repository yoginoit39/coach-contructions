"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { scrollLock } from "@/lib/scroll-lock";

/**
 * Entry gate: "lay the first brick". Click (or wait) and the brick drops into
 * the course at the bottom, the counter runs, the curtain lifts.
 */
export default function Gate() {
  const [show, setShow] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    let skip = false;
    try {
      skip = !!sessionStorage.getItem("coach-intro-v4");
    } catch {}
    if (skip) {
      intro.finish();
      return;
    }
    const id = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!show || !root.current) return;
    const el = root.current;
    scrollLock.stop();
    const brick = el.querySelector<HTMLElement>("[data-brick]")!;
    const slot = el.querySelector<HTMLElement>("[data-slot]")!;
    const num = el.querySelector<HTMLElement>("[data-num]")!;
    const ctx = gsap.context(() => {
      gsap.to(brick, { y: -10, rotate: -3, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    }, el);

    const go = () => {
      if (started.current) return;
      started.current = true;
      gsap.killTweensOf(brick);
      const b = brick.getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      const o = { v: 0 };
      gsap
        .timeline({
          onComplete: () => {
            try {
              sessionStorage.setItem("coach-intro-v4", "1");
            } catch {}
            setShow(false);
            setTimeout(() => {
              scrollLock.start();
              intro.finish();
            }, 0);
          },
        })
        .to(brick, { x: s.left - b.left, y: s.top - b.top, rotate: 0, duration: 0.9, ease: "bounce.out" })
        .to(el.querySelectorAll("[data-course] span"), { opacity: 1, duration: 0.2, stagger: 0.03 }, "-=0.3")
        .to(o, { v: 100, duration: 1, ease: "power2.inOut", onUpdate: () => (num.textContent = String(Math.round(o.v)).padStart(3, "0")) }, "-=0.2")
        .to(el.querySelectorAll("[data-ui]"), { opacity: 0, duration: 0.3 })
        .to(el, { yPercent: -100, duration: 1, ease: "expo.inOut" }, "-=0.1");
    };
    el.addEventListener("click", go);
    const auto = setTimeout(go, 4500);
    return () => {
      clearTimeout(auto);
      el.removeEventListener("click", go);
      ctx.revert();
    };
  }, [show]);

  if (!show) return null;
  return (
    <div ref={root} className="dark fixed inset-0 z-[1000] select-none" aria-hidden style={{ cursor: "pointer" }}>
      <div className="mono absolute left-6 top-6" data-ui>
        Coach // Construction &amp; Design
      </div>
      <div className="mono absolute right-6 top-6 hidden text-faint sm:block" data-ui>
        Kampala, Uganda
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 px-6" data-ui>
        <h1 className="display text-center text-[12vw] leading-[0.88] md:text-[7.5rem]">
          Lay the first
          <br />
          <span className="text-accent">brick</span> to enter
        </h1>
        <div data-brick className="h-14 w-28 rounded-sm bg-accent shadow-[0_30px_60px_-20px_rgba(215,255,60,0.6)] md:h-16 md:w-32" />
        <p className="mono text-faint">Click anywhere · or wait</p>
      </div>

      {/* the course of bricks at the bottom */}
      <div data-course className="absolute inset-x-6 bottom-20 flex gap-1.5 md:bottom-16">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="h-14 flex-1 rounded-sm border border-line opacity-0 md:h-16" />
        ))}
        <span data-slot className="h-14 w-28 rounded-sm border border-dashed border-accent/60 md:h-16 md:w-32" />
      </div>
      <div className="mono absolute bottom-6 left-6" data-ui>
        <span data-num>000</span>%
      </div>
      <div className="mono absolute bottom-6 right-6 text-faint" data-ui>
        Loading the site office
      </div>
    </div>
  );
}
