import type { Entry } from './data'
import { ExpeditionMap } from './ExpeditionMap'
import { useLang } from './lang'
import { Disclosure, Footer, Label, NextPage, PageHero, Reveal, external } from './ui'

/* ================= Home ================= */
export function Home() {
  const { c } = useLang()
  return (
    <section className="relative h-[100dvh] w-full overflow-hidden bg-black">
      {/* Rack focus: the sharp frame arrives first, then the background falls out of focus behind Sasha */}
      <img src="assets/images/hero/bg.jpg" alt="" className="anim-fade-in absolute inset-0 h-full w-full object-cover" />
      <img src="assets/images/hero/bg-blur.jpg" alt="" className="anim-focus absolute inset-0 h-full w-full object-cover" />
      <div className="anim-fade-in pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />

      <div
        className="anim-fade-up absolute inset-x-0 top-[16vh] z-10 overflow-hidden sm:top-[14vh]"
        style={{ animationDelay: '500ms' }}
      >
        <div className="marquee flex w-max whitespace-nowrap font-hn text-[16vh] leading-none tracking-[-0.03em] text-cream sm:text-[26vh]">
          <span className="pr-[6vw]">{c.ui.marquee}&nbsp;</span>
          <span className="pr-[6vw]" aria-hidden="true">
            {c.ui.marquee}&nbsp;
          </span>
        </div>
      </div>

      <div
        className="anim-line absolute inset-x-6 bottom-[5.5rem] z-10 h-0.5 bg-cream sm:inset-x-10 sm:bottom-28"
        style={{ animationDelay: '1200ms' }}
      />

      <img
        src="assets/images/hero/portrait.png"
        alt={c.ui.portraitAlt}
        className="anim-rise-in pointer-events-none absolute inset-0 z-20 h-full w-full object-cover"
        style={{ animationDelay: '300ms' }}
      />

      <footer className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 pb-5 font-hn text-xs leading-relaxed sm:z-10 sm:px-10 sm:pb-8 sm:text-sm">
        <div className="anim-fade-up" style={{ animationDelay: '1400ms' }}>
          {c.ui.homeLeft.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
        <div className="anim-fade-up text-right" style={{ animationDelay: '1550ms' }}>
          {c.ui.homeRight.map((t) => (
            <p key={t}>{t}</p>
          ))}
        </div>
      </footer>
    </section>
  )
}

/* ================= Shared timeline ================= */
function Timeline({ items }: { items: Entry[] }) {
  return (
    <ol>
      {items.map((e, idx) => (
        <Reveal as="li" key={idx} className="grid gap-4 border-t border-cream/15 py-10 sm:grid-cols-12 sm:gap-10 sm:py-14">
          <p className="text-sm text-cream/55 sm:col-span-3">{e.date}</p>
          <div className="sm:col-span-9">
            <h3 className="font-hn text-3xl leading-[1.05] tracking-[-0.025em] sm:text-5xl">{e.title}</h3>
            <p className="mt-3 text-sm text-cream/70 sm:text-base">{e.org}</p>
            {e.role && (
              <p className="mt-5 flex items-center gap-3 text-sm sm:text-base">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cream" />
                {e.role}
              </p>
            )}
            {e.body.map((p) => (
              <p key={p} className="mt-5 max-w-2xl text-base leading-relaxed text-cream/80 sm:text-[17px]">
                {p}
              </p>
            ))}
            {e.modules && (
              <div className={`mt-10 grid gap-8 ${e.modules.length > 2 ? 'lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
                {e.modules.map((m) => (
                  <div key={m.label}>
                    <Label>{m.label}</Label>
                    <ul className="mt-3">
                      {m.items.map((it) => (
                        <li key={it} className="border-t border-cream/10 py-2.5 text-sm leading-snug text-cream/80">
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {e.note && <Disclosure label={e.note.label}>{e.note.text}</Disclosure>}
          </div>
        </Reveal>
      ))}
    </ol>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="px-6 pt-20 sm:px-10 sm:pt-32">
      <Reveal className="mb-8">
        <Label>{label}</Label>
      </Reveal>
      {children}
    </section>
  )
}

/* ================= About ================= */
export function About() {
  const { c } = useLang()
  return (
    <main>
      <PageHero index="01 / 03" {...c.pages.about} coords="56.34° N · 2.80° W" />

      <section className="grid gap-12 px-6 pt-16 sm:grid-cols-12 sm:gap-10 sm:px-10 sm:pt-24">
        <Reveal className="sm:col-span-7">
          <p className="font-hn text-[28px] leading-[1.15] tracking-[-0.02em] sm:text-[3.4vw]">{c.about.intro}</p>
        </Reveal>
        <Reveal delay={120} className="sm:col-span-4 sm:col-start-9">
          <figure className="overflow-hidden">
            <img
              src="assets/images/expedition_photo1.jpg"
              alt={c.about.photoAlt}
              className="aspect-[4/5] w-full object-cover grayscale transition-[filter] duration-700 hover:grayscale-0"
            />
            <figcaption className="mt-3 text-xs text-cream/55">{c.about.photoCaption}</figcaption>
          </figure>
        </Reveal>
      </section>

      <Section label={c.sections.details}>
        <dl className="grid gap-x-10 border-t border-cream/15 sm:grid-cols-2">
          {c.about.facts.map((f, i) => (
            <Reveal key={i} delay={i * 60} className="flex justify-between gap-6 border-b border-cream/15 py-5">
              <dt className="text-sm text-cream/55">{f.k}</dt>
              <dd className="text-right text-sm sm:text-base">
                {f.href ? (
                  <a href={f.href} {...external(f.href)} className="transition-opacity duration-300 hover:opacity-60">
                    {f.v}
                  </a>
                ) : (
                  f.v
                )}
              </dd>
            </Reveal>
          ))}
          <Reveal className="flex justify-between gap-6 border-b border-cream/15 py-5">
            <dt className="text-sm text-cream/55">{c.sections.languages}</dt>
            <dd className="text-right text-sm sm:text-base">
              {c.about.languages.map((l) => (
                <span key={l.level} className="block">
                  {l.name} <span className="text-cream/55">— {l.level}</span>
                </span>
              ))}
            </dd>
          </Reveal>
        </dl>
      </Section>

      <Section label={c.sections.competencies}>
        <ol className="grid border-t border-cream/15 sm:grid-cols-2 lg:grid-cols-3">
          {c.about.skills.map((s, i) => (
            <Reveal as="li" key={i} delay={(i % 3) * 80} className="border-b border-cream/15 py-8 sm:pr-10">
              <span className="text-xs tabular-nums text-cream/55">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-6 font-hn text-2xl tracking-[-0.02em] sm:text-3xl">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/65">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section label={c.sections.qualities}>
        <Reveal>
          <p className="font-hn text-3xl leading-[1.15] tracking-[-0.02em] sm:text-5xl">
            {c.about.qualities.map((q, i) => (
              <span key={i}>
                {q}
                {i < c.about.qualities.length - 1 && <span className="text-cream/30"> / </span>}
              </span>
            ))}
          </p>
        </Reveal>
      </Section>

      <Section label={c.sections.hobbies}>
        <ol className="border-t border-cream/15">
          {c.hobbies.map((h, i) => (
            <Reveal
              as="li"
              key={i}
              className="grid gap-3 border-b border-cream/15 py-8 sm:grid-cols-12 sm:items-baseline sm:gap-10 sm:py-10"
            >
              <span className="text-xs tabular-nums text-cream/55 sm:col-span-1">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-hn text-4xl leading-none tracking-[-0.035em] sm:col-span-5 sm:text-6xl">{h.title}</h3>
              <p className="max-w-md text-base leading-relaxed text-cream/75 sm:col-span-6 sm:text-[17px]">{h.text}</p>
            </Reveal>
          ))}
        </ol>
      </Section>

      <NextPage label={c.nav[1].label} href="#/education" />
      <Footer />
    </main>
  )
}

/* ================= Education ================= */
export function Education() {
  const { c } = useLang()
  return (
    <main>
      <PageHero index="02 / 03" {...c.pages.education} coords="64.54° N · 40.54° E  →  56.34° N · 2.80° W" />
      <Section label={c.sections.degrees}>
        <Timeline items={c.education} />
      </Section>
      <NextPage label={c.nav[2].label} href="#/experience" />
      <Footer />
    </main>
  )
}

/* ================= Experience ================= */
export function Experience() {
  const { c } = useLang()
  return (
    <main>
      <PageHero index="03 / 03" {...c.pages.experience} coords="65.02° N · 35.71° E" />

      <Section label={c.sections.geography}>
        <Reveal>
          <ExpeditionMap />
        </Reveal>
      </Section>

      <Section label={c.sections.expeditions}>
        <Timeline items={c.expeditions} />
      </Section>

      <Section label={c.sections.work}>
        <Timeline items={c.work} />
      </Section>

      <Section label={c.sections.conferences}>
        <Timeline items={c.conferences} />
      </Section>

      <Section label={c.sections.gallery}>
        <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
          {c.gallery.map((g, i) => (
            <Reveal as="figure" key={g.src} delay={i * 100}>
              <div className="overflow-hidden">
                <img
                  src={g.src}
                  alt={g.title}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </div>
              <figcaption className="mt-3">
                <p className="text-sm">{g.title}</p>
                <p className="text-xs text-cream/55">{g.caption}</p>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </Section>

      <NextPage label={c.ui.backToStart} href="#/" />
      <Footer />
    </main>
  )
}
