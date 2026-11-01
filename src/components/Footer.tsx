import Link from "next/link";

const LINKS = [
  ["Build", "/#top"],
  ["Work", "/#work"],
  ["Services", "/#services"],
  ["Contact", "/#contact"],
];
const SOCIAL = ["Instagram", "LinkedIn", "Facebook", "YouTube"];

export default function Footer() {
  return (
    <footer className="dark px-[var(--pad)] pb-24 pt-20 md:pb-8">
      <div className="display select-none text-[26vw] leading-[0.8] text-ink/[0.08] md:text-[19vw]">Coach</div>
      <div className="mt-6 grid gap-10 border-t border-line pt-10 md:grid-cols-12">
        <div className="md:col-span-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/logo-mark.png" alt="Coach Construction and Design" className="w-64" />
          <p className="mt-6 max-w-sm text-muted">Architectural design, construction, renovation and project management across Uganda since 2014.</p>
        </div>
        <ul className="space-y-2 md:col-span-2">
          {LINKS.map(([l, h]) => (
            <li key={l}>
              <Link href={h} className="ul" data-hover>
                {l}
              </Link>
            </li>
          ))}
        </ul>
        <ul className="space-y-2 md:col-span-2">
          {SOCIAL.map((s) => (
            <li key={s}>
              <a href="#" className="ul text-muted hover:text-ink" data-hover>
                {s}
              </a>
            </li>
          ))}
        </ul>
        <ul className="space-y-2 text-muted md:col-span-3">
          <li>
            <a href="mailto:info@coachcanddesign.com" className="ul" data-hover>
              info@coachcanddesign.com
            </a>
          </li>
          <li>
            <a href="tel:+256781149685" className="ul" data-hover>
              +256 781 149685
            </a>
          </li>
          <li>Mon – Fri 8:00 – 18:00 · Sat 9:00 – 14:00</li>
        </ul>
      </div>
      <div className="mono mt-16 flex flex-col gap-2 border-t border-line pt-5 text-faint md:flex-row md:justify-between">
        <span>© 2026 Coach Construction and Design · Kampala</span>
        <span className="flex gap-5">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </span>
      </div>
    </footer>
  );
}
