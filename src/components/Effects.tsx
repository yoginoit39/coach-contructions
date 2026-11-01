"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";

/** [data-parallax] images drift on scroll. No custom cursor. */
export default function Effects() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        const amt = Number(el.dataset.parallax || 10);
        gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: "none", scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    });
    return () => ctx.revert();
  }, []);
  return null;
}
