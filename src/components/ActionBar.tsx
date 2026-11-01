"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { intro } from "@/lib/intro";

/** Phones only: call / start a project, pinned to the bottom. Hidden while the hero build is on screen. */
export default function ActionBar() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    gsap.set(el, { yPercent: 120 });
    let heroVisible = true;
    let ready = false;
    const apply = () => gsap.to(el, { yPercent: ready && !heroVisible ? 0 : 120, duration: 0.6, ease: "expo.out", overwrite: true });
    const hero = document.getElementById("top");
    const io = hero ? new IntersectionObserver(([e]) => ((heroVisible = e.isIntersecting), apply()), { threshold: 0.05 }) : null;
    if (hero) io!.observe(hero);
    const off = intro.onDone(() => ((ready = true), apply()));
    return () => {
      io?.disconnect();
      off();
    };
  }, []);

  return (
    <div ref={ref} className="fixed inset-x-3 bottom-3 z-[500] flex gap-2 md:hidden">
      <a href="tel:+256781149685" className="mono flex flex-1 items-center justify-center gap-2 border border-line-strong bg-[#0c1413]/90 py-3.5 text-ink backdrop-blur">
        Call
      </a>
      <Link href="/#contact" className="mono flex flex-[2] items-center justify-center gap-2 bg-accent py-3.5 text-accent-ink">
        Start a project →
      </Link>
    </div>
  );
}
