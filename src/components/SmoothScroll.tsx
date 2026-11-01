"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";

/** Native scrolling. Anchor links scroll smoothly; the page always opens at the top. */
export default function SmoothScroll() {
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a) return;
      const id = a.getAttribute("href")!.replace(/^\//, "");
      if (id === "#") return;
      const target = document.querySelector<HTMLElement>(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    document.addEventListener("click", onClick);
    ScrollTrigger.refresh();
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
