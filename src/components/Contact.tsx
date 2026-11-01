"use client";

import { useState, type FormEvent } from "react";
import Reveal from "./Reveal";
import { Arrow, Label } from "./ui";

const TYPES = ["Private home", "Apartments", "Commercial / offices", "Hospitality", "Renovation", "Something else"];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const subject = encodeURIComponent(`New project enquiry · ${f.get("type")}`);
    const body = encodeURIComponent(`Name: ${f.get("name")}\nEmail: ${f.get("email")}\nProject: ${f.get("type")}\nLocation: ${f.get("location")}\n\n${f.get("message")}`);
    window.location.href = `mailto:info@coachcanddesign.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <section id="contact" className="px-5 py-28 md:px-8 md:py-44">
      <Reveal>
        <Label>06 · Start a project</Label>
        <h2 className="display mt-6 text-[16vw] md:text-[10rem] lg:text-[12rem]" data-lines>
          Let&rsquo;s <em>build</em> yours.
        </h2>
      </Reveal>
      <div className="mt-14 grid gap-14 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <p className="max-w-sm text-[1.05rem] leading-relaxed text-muted" data-stagger>
            We will visit the site, listen to the brief and come back with drawings and an honest estimate. Usually within one
            working day.
          </p>
          <ul className="display mt-10 space-y-3 text-[1.35rem] md:text-3xl" data-stagger>
            <li>
              <a href="tel:+256781149685" className="ul" data-hover>
                +256 781 149685
              </a>
            </li>
            <li>
              <a href="mailto:info@coachcanddesign.com" className="ul" data-hover>
                info@coachcanddesign.com
              </a>
            </li>
            <li className="text-muted">Kampala, Uganda</li>
          </ul>
        </Reveal>
        <Reveal className="md:col-span-7 md:col-start-6">
          <form onSubmit={submit} className="grid gap-x-10 gap-y-6 md:grid-cols-2" data-stagger>
            <label className="block">
              <span className="mono text-faint">Name</span>
              <input name="name" required className="field" placeholder="Your name" />
            </label>
            <label className="block">
              <span className="mono text-faint">Email</span>
              <input name="email" type="email" required className="field" placeholder="you@example.com" />
            </label>
            <label className="block">
              <span className="mono text-faint">Project</span>
              <select name="type" className="field" defaultValue={TYPES[0]}>
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mono text-faint">Location</span>
              <input name="location" className="field" placeholder="Kampala, Wakiso, Masaka…" />
            </label>
            <label className="block md:col-span-2">
              <span className="mono text-faint">Brief</span>
              <textarea name="message" rows={3} className="field resize-y" placeholder="Plot size, rooms, budget range, timeline." />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
              <p className="text-sm text-faint">Opens your email app with the details filled in.</p>
              <button type="submit" className="btn" data-hover>
                Send the brief <Arrow />
              </button>
            </div>
            {sent && <p className="mono text-accent md:col-span-2">Thanks. We will be in touch within one working day.</p>}
          </form>
        </Reveal>
      </div>
    </section>
  );
}
