"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

/**
 * A photo that scrolls in as a pencil line drawing, then fills with the real
 * image. Mount <PencilFilter/> once per page.
 */
export function Sketch({ src, alt, className = "", imgClassName = "", eager = false }: { src: string; alt: string; className?: string; imgClassName?: string; eager?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const ctx = gsap.context(() => {
      gsap.fromTo(el, { "--fill": 0 }, { "--fill": 1, ease: "none", scrollTrigger: { trigger: el, start: "top 90%", end: "top 30%", scrub: 0.4 } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <span ref={ref} className={`sketch block ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={imgClassName} loading={eager ? "eager" : "lazy"} draggable={false} />
      <span className="sketch-tone" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" aria-hidden className={`sketch-lines ${imgClassName}`} loading={eager ? "eager" : "lazy"} draggable={false} />
    </span>
  );
}

/** Edge-detect filter: grayscale → blur → laplacian → boost. Inverted by CSS to dark lines on paper. */
export function PencilFilter() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden>
      <filter id="pencil" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" />
        <feGaussianBlur stdDeviation="0.7" />
        <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" preserveAlpha="true" />
        <feComponentTransfer>
          <feFuncR type="linear" slope="5" />
          <feFuncG type="linear" slope="5" />
          <feFuncB type="linear" slope="5" />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

/** Giant hollow chapter number bleeding off the edge, drifting on scroll. */
export function Chapter({ n, side = "right" }: { n: string; side?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const ctx = gsap.context(() => {
      gsap.fromTo(el.firstElementChild, { yPercent: 18 }, { yPercent: -18, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div ref={ref} className={`pointer-events-none relative h-[18vw] overflow-hidden md:h-[14vw] ${side === "right" ? "text-right" : ""}`} aria-hidden>
      <span className={`display hollow absolute top-0 text-[30vw] leading-[0.8] text-ink/60 md:text-[22vw] ${side === "right" ? "-right-[0.06em]" : "-left-[0.06em]"}`}>{n}</span>
    </div>
  );
}

/** Sheet label for section eyebrows. */
export function SheetTag({ n, of = 6 }: { n: number; of?: number }) {
  return (
    <span className="mono text-ghost">
      Sheet {String(n).padStart(2, "0")}/{String(of).padStart(2, "0")} · Rev B · Drawn Kampala
    </span>
  );
}
