import { useEffect, useRef, useState, type ReactNode } from 'react'
import { LangSwitch, useLang } from './lang'
import { DeepWhale } from './Whales'

export const EASE = 'var(--ease-in-out)'
export const external = (href: string) =>
  href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- Hash route ---------- */
export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '') || 'home'
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

/* ---------- Scroll reveal ---------- */
export function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'li' | 'section' | 'figure' | 'article'
}) {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${shown ? 'is-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}

/* ---------- Expandable note (interruptible: CSS transition re-targets from the live value) ---------- */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-6">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="press group flex min-h-11 items-center gap-3 text-xs uppercase tracking-[0.2em] text-cream/55 hover:text-cream"
      >
        <Plus open={open} />
        {label}
      </button>
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300 ease-drawer"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="max-w-xl pt-2 text-[0.9375rem] leading-relaxed text-cream/60">{children}</p>
        </div>
      </div>
    </div>
  )
}

function Plus({ open }: { open: boolean }) {
  return (
    <span
      className="relative block h-3 w-3 shrink-0 transition-transform duration-300"
      style={{ transform: open ? 'rotate(45deg)' : 'none', transitionTimingFunction: EASE }}
    >
      <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-current" />
      <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-current" />
    </span>
  )
}

/* ---------- Header + mobile drawer ---------- */
export function Chrome({ route, overlay = false }: { route: string; overlay?: boolean }) {
  const { c } = useLang()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (overlay) return
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [overlay])

  useEffect(() => setOpen(false), [route])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const d = (ms: number) => ({ animationDelay: `${overlay ? ms : ms - 700}ms` })
  const active = (href: string) => href === `#/${route}`
  const pos = overlay ? 'absolute' : 'fixed'

  return (
    <>
      <header data-lang-fade className={`${pos} inset-x-0 top-0 z-30 flex items-start justify-between px-6 pb-5 pt-6 sm:px-10 sm:pt-8`}>
        {/* Translucent material that materialises once content scrolls underneath */}
        {!overlay && (
          <div
            aria-hidden
            className="glass pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 ease-out"
            style={{ opacity: scrolled ? 1 : 0 }}
          />
        )}
        <div className="anim-fade-up" style={d(800)}>
          <a href="#/" className="press block font-hn text-lg tracking-wide">
            {c.ui.brand}
          </a>
          {!overlay && <Depth />}
        </div>

        <div className="hidden items-start gap-16 sm:flex lg:gap-24">
          <div className="anim-fade-up flex flex-col gap-0.5 text-sm" style={d(900)}>
            <span>2026</span>
            <LangSwitch />
          </div>
          <nav className="flex flex-col gap-0.5 text-sm">
            {c.nav.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={active(l.href) ? 'page' : undefined}
                className="anim-fade-up group flex items-center transition-opacity duration-200 ease-out hover:opacity-60"
                style={d(1000 + i * 80)}
              >
                <span
                  aria-hidden
                  className="mr-2 h-1 w-1 rounded-full bg-cream transition-[opacity,transform] duration-300 ease-out"
                  style={{
                    opacity: active(l.href) ? 1 : 0,
                    transform: active(l.href) ? 'none' : 'translateX(-6px) scale(0.5)',
                  }}
                />
                <span
                  className="transition-transform duration-300 ease-out"
                  style={{ transform: active(l.href) ? 'none' : 'translateX(-12px)' }}
                >
                  {l.label}
                </span>
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-0.5 text-sm">
            {c.social.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                {...external(l.href)}
                className="anim-fade-up transition-opacity duration-200 ease-out hover:opacity-60"
                style={d(1150 + i * 80)}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile: language one tap away, next to the menu */}
      <div className={`anim-fade-up ${pos} right-16 top-4 z-30 sm:hidden`} style={d(900)}>
        <LangSwitch className="h-11 text-sm [&_button]:h-11 [&_button]:px-1.5" />
      </div>

      {/* Hamburger ⇄ close morph */}
      <button
        type="button"
        aria-label={open ? c.ui.closeMenu : c.ui.openMenu}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`anim-fade-up ${pos} right-4 top-4 z-50 flex h-11 w-11 items-center justify-center sm:hidden`}
        style={d(900)}
      >
        <span className="relative block h-[16px] w-[24px]">
          <span
            className="absolute left-0 top-0 h-[2px] w-[24px] bg-cream transition-transform duration-300 ease-in-out"
            style={{ transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }}
          />
          <span
            className="absolute left-0 top-[7px] h-[2px] w-[24px] bg-cream transition-opacity duration-150"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="absolute bottom-0 left-0 h-[2px] w-[24px] bg-cream transition-transform duration-300 ease-in-out"
            style={{ transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }}
          />
        </span>
      </button>

      <div className="sm:hidden">
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ease-out ${
            open ? 'opacity-100 duration-300' : 'pointer-events-none opacity-0 duration-200'
          }`}
        />
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-[80%] max-w-sm bg-[#141414] px-8 py-10 text-cream transition-[transform,opacity,visibility] ease-drawer motion-reduce:translate-x-0 ${
            open ? 'translate-x-0 duration-500' : 'invisible translate-x-full duration-300 motion-reduce:opacity-0'
          }`}
          aria-hidden={!open}
        >
          <Stagger open={open} delay={120} from="translate-y-6">
            <p className="mt-16 text-xs uppercase tracking-[0.2em] text-cream/50">{c.ui.siteIndex}</p>
          </Stagger>
          <nav className="mt-4 flex flex-col gap-2">
            {c.nav.map((l, i) => (
              <Stagger key={l.href} open={open} delay={160 + i * 50} from="translate-y-6">
                <a href={l.href} className={`text-4xl tracking-[-0.02em] ${active(l.href) ? '' : 'text-cream/60'}`}>
                  {l.label}
                </a>
              </Stagger>
            ))}
          </nav>

          <Stagger open={open} delay={300} from="translate-y-4">
            <p className="mt-14 text-xs uppercase tracking-[0.2em] text-cream/50">{c.ui.findMe}</p>
          </Stagger>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {c.social.map((l, i) => (
              <Stagger key={l.href} open={open} delay={330 + i * 40} from="translate-y-4">
                <a href={l.href} {...external(l.href)} className="inline-flex min-h-11 items-center">
                  {l.label}
                </a>
              </Stagger>
            ))}
          </div>

          <Stagger open={open} delay={440} from="translate-y-4">
            <p className="mt-10 text-xs uppercase tracking-[0.2em] text-cream/50">{c.ui.language}</p>
            <LangSwitch className="mt-2 text-2xl [&_button]:min-h-11" />
          </Stagger>
        </aside>
      </div>
    </>
  )
}

function Stagger({ open, delay, from, children }: { open: boolean; delay: number; from: string; children: ReactNode }) {
  return (
    <div
      className={`transition-[opacity,transform] ease-out motion-reduce:translate-y-0 ${
        open ? 'translate-y-0 opacity-100 duration-500' : `${from} opacity-0 duration-150`
      }`}
      style={{ transitionDelay: open ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

/* ---------- Shared page scaffolding ---------- */
export function PageHero({
  index,
  eyebrow,
  title,
  coords,
  place,
}: {
  index: string
  eyebrow: string
  title: string
  coords: string
  place: string
}) {
  // Long words (e.g. «Образование») shrink to fit the line instead of overflowing it
  const fit = `${(150 / title.length).toFixed(2)}vw`
  return (
    <div className="px-6 pt-32 sm:px-10 sm:pt-44">
      <div
        className="anim-fade-up flex items-baseline justify-between gap-6 text-xs uppercase tracking-[0.2em] text-cream/55"
        style={{ animationDelay: '150ms' }}
      >
        <span>{eyebrow}</span>
        <span className="shrink-0">{index}</span>
      </div>
      <h1
        className="anim-fade-up mt-6 font-hn text-[min(17vw,var(--fit))] leading-[0.88] tracking-[-0.045em] sm:text-[min(13vw,var(--fit))]"
        style={{ animationDelay: '250ms', ['--fit' as string]: fit }}
      >
        {title}
      </h1>
      <div className="anim-line mt-8 h-0.5 bg-cream sm:mt-12" style={{ animationDelay: '500ms' }} />
      <div
        className="anim-fade-up mt-4 flex flex-wrap justify-between gap-x-6 gap-y-1 text-xs tabular-nums text-cream/55"
        style={{ animationDelay: '800ms' }}
      >
        <span>{coords}</span>
        <span>{place}</span>
      </div>
    </div>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs uppercase tracking-[0.2em] text-cream/55">{children}</p>
}

export function NextPage({ label, href }: { label: string; href: string }) {
  const { c } = useLang()
  return (
    <a href={href} className="group block px-6 pb-10 pt-24 sm:px-10 sm:pt-40">
      <Label>{c.ui.next}</Label>
      <div className="mt-4 flex items-end justify-between gap-6 border-t-2 border-cream pt-6">
        <span
          className="font-hn text-[12vw] leading-[0.9] tracking-[-0.04em] transition-transform duration-300 ease-out group-hover:translate-x-3 group-active:translate-x-1 sm:text-[9vw]"
        >
          {label}
        </span>
        <span
          className="mb-[2vw] text-3xl transition-transform duration-300 ease-out group-hover:translate-x-2 sm:text-5xl"
        >
          →
        </span>
      </div>
    </a>
  )
}

export function Footer() {
  const { c } = useLang()
  return (
    <footer className="flex flex-col gap-2 px-6 pb-8 text-xs text-cream/50 sm:flex-row sm:justify-between sm:px-10 sm:text-sm">
      <span>{c.ui.footer[0]}</span>
      <span>{c.ui.footer[1]}</span>
    </footer>
  )
}

/* ---------- Depth gauge: scroll position read as metres below the surface ---------- */
function Depth() {
  const { c } = useLang()
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (ref.current) ref.current.textContent = String(Math.round(window.scrollY / 6)).padStart(4, '0')
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', on)
    }
  }, [])
  return (
    <p className="mt-1 text-[0.6875rem] tabular-nums text-cream/45" aria-hidden>
      {c.ui.depth} <span ref={ref}>0000</span> {c.ui.metres}
    </p>
  )
}

/* ---------- Sea: live swell. Each line is two travelling sines, so crests rise, roll and break
   apart like real water; scrolling fast stirs the surface, and it settles back when you stop. ---------- */
const W = 1200
const layers = [
  { mid: 34, amp: 9, k1: 2, k2: 5, w1: 0.32, w2: -0.21, phase: 0, opacity: 0.1, fill: 0 },
  { mid: 56, amp: 7, k1: 3, k2: 7, w1: 0.45, w2: -0.33, phase: 1.7, opacity: 0.15, fill: 0.02 },
  { mid: 76, amp: 5.5, k1: 4, k2: 9, w1: 0.6, w2: -0.47, phase: 3.1, opacity: 0.22, fill: 0.035 },
]

function surface(l: (typeof layers)[number], t: number, stir: number) {
  const a = l.amp * (1 + stir)
  const lift = Math.sin(t * 0.25 + l.phase) * 2 // the whole line breathes up and down
  let d = ''
  for (let x = 0; x <= W; x += 12) {
    const u = (x / W) * Math.PI * 2
    const y =
      l.mid + lift + a * (0.72 * Math.sin(l.k1 * u - l.w1 * t + l.phase) + 0.28 * Math.sin(l.k2 * u - l.w2 * t))
    d += `${x ? 'L' : 'M'}${x} ${y.toFixed(2)}`
  }
  return d
}

export function Sea() {
  const lines = useRef<(SVGPathElement | null)[]>([])
  const fills = useRef<(SVGPathElement | null)[]>([])

  useEffect(() => {
    const draw = (t: number, stir: number) =>
      layers.forEach((l, i) => {
        const d = surface(l, t, stir)
        lines.current[i]?.setAttribute('d', d)
        fills.current[i]?.setAttribute('d', `${d}L${W} 100L0 100Z`)
      })

    // Reduced motion gets a gentler equivalent, not a frozen sea: a third of the speed, no scroll stirring
    const calm = reducedMotion()
    const speed = calm ? 0.35 : 1

    let raf = 0
    let stir = 0
    let lastY = window.scrollY
    let lastT = performance.now()
    const t0 = lastT
    const frame = (now: number) => {
      const dt = Math.max(1, now - lastT)
      const dy = Math.abs(window.scrollY - lastY)
      const v = dy > 400 ? 0 : dy / dt // px per ms; bigger single-frame jumps are teleports, not scrolling
      lastY = window.scrollY
      lastT = now
      // rise quickly with scroll speed, decay smoothly — never a hard cut
      const target = calm ? 0 : Math.min(v * 0.9, 1.4)
      stir += (target - stir) * (target > stir ? 0.2 : 0.035)
      draw(((now - t0) / 1000) * speed, stir)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-[55vh] bg-gradient-to-t from-[#4fb3c2]/[0.08] to-transparent" />
      <DeepWhale />
      <svg viewBox={`0 0 ${W} 100`} preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[36vh] w-full">
        {layers.map((l, i) => (
          <g key={i}>
            <path ref={(el) => void (fills.current[i] = el)} fill="#4fb3c2" fillOpacity={l.fill} />
            <path
              ref={(el) => void (lines.current[i] = el)}
              fill="none"
              stroke="#efeee9"
              strokeOpacity={l.opacity}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
    </div>
  )
}
