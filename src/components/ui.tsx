import Link from "next/link";
import type { ReactNode } from "react";

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden className={className}>
      <path d="M2 7h10M7.5 2.5L12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Btn({ href, children, ghost = false, className = "" }: { href: string; children: ReactNode; ghost?: boolean; className?: string }) {
  return (
    <Link href={href} data-hover className={`btn group/b ${ghost ? "btn-ghost" : ""} ${className}`}>
      <span>{children}</span>
      <Arrow className="transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover/b:translate-x-1" />
    </Link>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`mono inline-flex items-center gap-3 text-faint ${className}`}>
      <span className="text-accent">{"//"}</span>
      {children}
    </span>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display inline-flex items-baseline gap-3 whitespace-nowrap text-[1.5rem] leading-none ${className}`}>
      Coach
      <span className="mono hidden opacity-70 md:inline">{"// Construction & Design"}</span>
    </span>
  );
}
