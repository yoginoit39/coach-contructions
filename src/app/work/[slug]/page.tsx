import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Effects from "@/components/Effects";
import Footer from "@/components/Footer";
import Hud from "@/components/Hud";
import IntroDone from "@/components/IntroDone";
import SmoothScroll from "@/components/SmoothScroll";
import WorkStage from "@/components/WorkStage";
import { categoryOf, projects } from "@/lib/projects";

export const instant = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  return { title: p ? `${p.title} · Coach Construction and Design` : "Work · Coach" };
}

const SERVICES: Record<string, string> = {
  Residential: "Architectural design · Construction · Finishing",
  Apartments: "Architectural design · Construction · Project management",
  Commercial: "Architectural design · Construction · Project management",
  Hospitality: "Architectural design · Construction · Landscaping",
};

export default async function WorkPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const idx = projects.findIndex((x) => x.slug === slug);
  if (idx < 0) notFound();
  const p = projects[idx];
  const code = `C${String(idx + 1).padStart(2, "0")}`;
  const prev = projects[(idx - 1 + projects.length) % projects.length];
  const next = projects[(idx + 1) % projects.length];
  const cat = categoryOf(p);
  const meta: [string, string][] = [
    ["Status", p.status],
    ["Location", p.location],
    ["Type", p.type],
    ["Category", cat],
    ["Services", SERVICES[cat] ?? SERVICES.Commercial],
    ["Images", String(p.images.length)],
  ];
  return (
    <>
      <SmoothScroll />
      <IntroDone />
      <Effects />
      <Hud />
      <main>
        <WorkStage project={p} code={code} />

        {/* info header */}
        <section className="border-t border-line px-[var(--pad)] pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <span className="mono text-faint">
                {cat} · {code}
              </span>
              <h2 className="display mt-6 text-[11vw] md:text-[clamp(1.8rem,6.3vw,5.6rem)]">{p.title}</h2>
              <h3 className="display hollow mt-2 text-[6vw] md:text-[clamp(1.2rem,3vw,2.6rem)]">{p.type}</h3>
            </div>
            <dl className="mono grid grid-cols-[7rem_1fr] gap-y-3 self-end text-faint md:col-span-4">
              {meta.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt>{k}:</dt>
                  <dd className="text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-16 grid gap-10 border-t border-line pt-10 md:grid-cols-12">
            <span className="mono text-faint md:col-span-2">Brief</span>
            <div className="max-w-[62ch] text-[14px] leading-[1.75] text-ink md:col-span-7">
              <p>{p.blurb}</p>
              <p className="mt-5 text-muted">
                Drawn, approved, built and finished by Coach Construction and Design, Kampala. {p.status === "Completed 2025" || p.status === "Completed 2024" ? "Handed over with as-built drawings and warranties." : p.status === "Under construction" ? "On site now: weekly programme and photo updates to the client." : "In design: concept, 3D views and approval set in progress."}
              </p>
            </div>
          </div>
        </section>

        {/* media grid */}
        <section className="border-t border-line px-[var(--pad)] py-16 md:py-24">
          <span className="mono text-faint">Media · {p.images.length}</span>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {p.images.map((src, k) => (
              <figure key={src} className={k === 0 ? "md:col-span-2" : ""}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${p.title} ${k + 1}`} className="w-full object-cover" loading="lazy" />
                <figcaption className="mono mt-3 text-ghost">
                  {code}.{String(k + 1).padStart(2, "0")} · {p.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* prev / next */}
        <section className="grid border-t border-line md:grid-cols-2">
          <Link href={`/work/${prev.slug}`} className="group border-b border-line px-[var(--pad)] py-10 md:border-b-0 md:border-r" data-hover>
            <span className="mono text-faint">← Previous</span>
            <span className="display mt-3 block text-[7vw] md:text-[2.4rem]">{prev.title}</span>
          </Link>
          <Link href={`/work/${next.slug}`} className="group px-[var(--pad)] py-10 text-right" data-hover>
            <span className="mono text-faint">Next →</span>
            <span className="display mt-3 block text-[7vw] md:text-[2.4rem]">{next.title}</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
