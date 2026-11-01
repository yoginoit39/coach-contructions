"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { intro } from "@/lib/intro";
import { scrollLock } from "@/lib/scroll-lock";
import { img } from "@/lib/images";
import { Wordmark } from "./ui";

const LINKS = [
  { href: "/#top", label: "Build", n: "00" },
  { href: "/#work", label: "Work", n: "01" },
  { href: "/#services", label: "Services", n: "02" },
  { href: "/#process", label: "Process", n: "03" },
  { href: "/#contact", label: "Contact", n: "03" },
];
const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Africa/Kampala" });

/** Fixed chrome: wordmark, clock, menu button, full-screen menu. Reads over anything via difference blend. */
export default function Hud() {
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(fmt.format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = bar.current!;
    gsap.set(el, { opacity: 0 });
    return intro.onDone(() => gsap.to(el, { opacity: 1, duration: 1, delay: 0.5 }));
  }, []);

  useEffect(() => {
    const el = overlay.current!;
    const links = el.querySelectorAll("[data-link]");
    if (open) {
      scrollLock.stop();
      gsap
        .timeline()
        .set(el, { pointerEvents: "auto" })
        .to(el, { clipPath: "inset(0% 0 0% 0)", duration: 0.8, ease: "expo.inOut" })
        .from(links, { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.06 }, "-=0.3")
        .from(el.querySelector("[data-pic]"), { clipPath: "inset(100% 0 0 0)", duration: 0.9, ease: "expo.out" }, "-=0.8");
    } else {
      gsap.to(el, { clipPath: "inset(0% 0 100% 0)", duration: 0.6, ease: "expo.inOut", onComplete: () => gsap.set(el, { pointerEvents: "none" }) });
      scrollLock.start();
    }
  }, [open]);

  return (
    <>
      <div ref={bar} className="fixed inset-x-0 top-0 z-[600] flex items-start justify-between px-5 py-5 text-ink md:px-8">
        <Link href="/" aria-label="Coach home" data-hover>
          <Wordmark />
        </Link>
        <div className="mono hidden items-center gap-3 md:flex">
          <span className="opacity-70">Kampala</span>
          <span className="tabular-nums">{time ?? "--:--:--"}</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="mono flex items-center gap-3" aria-expanded={open} data-hover>
          {open ? "Close" : "Menu"}
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-px w-6 bg-current transition-transform duration-500 ${open ? "translate-y-[5.5px] rotate-45" : ""}`} />
            <span className={`absolute bottom-0 left-0 h-px w-6 bg-current transition-transform duration-500 ${open ? "-translate-y-[5.5px] -rotate-45" : ""}`} />
          </span>
        </button>
      </div>

      <div ref={overlay} className="dark pointer-events-none fixed inset-0 z-[550] [clip-path:inset(0%_0_100%_0)]">
        <div className="grid h-full grid-cols-1 content-end gap-8 px-5 pb-8 pt-24 md:grid-cols-12 md:content-stretch md:px-8 md:pb-10 md:pt-28">
          <nav className="flex flex-col justify-end md:col-span-7">
            {LINKS.map((l) => (
              <div key={l.href} className="overflow-hidden border-b border-line">
                <Link href={l.href} onClick={() => setOpen(false)} data-link className="display group flex items-baseline gap-6 py-2 text-[12vw] leading-[0.9] md:py-3 md:text-[8rem]" data-hover>
                  <span className="mono text-faint">{l.n}</span>
                  <span className="transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-4">{l.label}</span>
                </Link>
              </div>
            ))}
          </nav>
          <div className="flex flex-col justify-end gap-6 md:col-span-4 md:col-start-9">
            <div data-pic className="hidden aspect-[4/5] overflow-hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.teamPortrait} alt="Coach site team" className="h-full w-full object-cover" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/logo-mark.png" alt="Coach Construction and Design" className="w-40 md:w-56" />
            <div className="mono space-y-1 text-muted">
              <p>Kampala, Uganda</p>
              <p>
                <a href="mailto:info@coachcanddesign.com" className="ul">
                  info@coachcanddesign.com
                </a>
              </p>
              <p>
                <a href="tel:+256781149685" className="ul">
                  +256 781 149685
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
