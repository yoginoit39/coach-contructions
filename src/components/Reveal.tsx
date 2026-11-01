"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, SplitText } from "@/lib/gsap";

/**
 * Scroll-in helper. Children with [data-stagger] fade up in sequence;
 * children with [data-lines] get a masked line-by-line text reveal.
 */
export default function Reveal({ children, className = "", start = "top 82%" }: { children: ReactNode; className?: string; start?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-lines]").forEach((t) => {
        const s = SplitText.create(t, { type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true });
        splits.push(s);
        gsap.from(s.lines, { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: t, start, once: true } });
      });
      const items = el.querySelectorAll("[data-stagger]");
      if (items.length) gsap.from(items, { y: 26, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start, once: true } });
    }, el);
    return () => {
      ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, [start]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
