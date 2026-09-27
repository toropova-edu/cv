import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Frame, Species, WhaleView } from './whale'
import { useLang } from './lang'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** metres, same scale as the depth gauge in the header (scrollY / 6) */
const DEPTH = 150
const depthOf = () => window.scrollY / 6

/* The deep one steps back while any encounter band is on screen, so it never doubles up with a close whale. */
const PASS_EVENT = 'whalepass'
const onScreen = new Set<string>()
const announcePass = (id: string, visible: boolean) => {
  if (visible) onScreen.add(id)
  else onScreen.delete(id)
  window.dispatchEvent(new CustomEvent(PASS_EVENT, { detail: onScreen.size > 0 }))
}

/**
 * How each species moves through its band.
 * size: relative to the beluga · base/boost: tail-beat rate at rest / extra while moving
 * amp: tail amplitude · arc: rise and fall across the band · bob/bobRate: body heave while cruising
 */
const CHARACTER: Record<Species, { size: number; base: number; boost: number; amp: number; arc: number; bob: number; bobRate: number }> = {
  beluga: { size: 1, base: 1.5, boost: 1.4, amp: 0.1, arc: 0.1, bob: 0.03, bobRate: 0.6 },
  // long and unhurried: a slow, shallow beat and an almost level glide
  minke: { size: 1.15, base: 1.1, boost: 1.0, amp: 0.07, arc: 0.06, bob: 0.02, bobRate: 0.4 },
  // small and quick, rolling up and down as porpoises do
  porpoise: { size: 0.72, base: 2.6, boost: 2.0, amp: 0.13, arc: 0.12, bob: 0.07, bobRate: 1.3 },
}

/** How far the arrows turn the animal: a little to the left, more to the right (degrees) */
const TURN_LEFT = -25
const TURN_RIGHT = 45
const turnDeg = (step: number) => (step < 0 ? TURN_LEFT : step > 0 ? TURN_RIGHT : 0)

/* ─────────────────────────── 1. The deep one ───────────────────────────
   Lives in the sea behind the inner pages. Past 150 m a faint beluga slides out of the dark,
   crosses the screen in ~40 s, rests, and comes again. Rising above 150 m, it fades away. */
export function DeepWhale() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [deep, setDeep] = useState(false)
  const [near, setNear] = useState(false) // close enough to the threshold to start loading
  const [yield_, setYield] = useState(false) // the Solovki whale is on screen
  const deepRef = useRef(false)
  const view = useRef<WhaleView | null>(null)

  useEffect(() => {
    const on = () => {
      const d = depthOf()
      setNear((n) => n || d > DEPTH * 0.6)
      setDeep(d > DEPTH)
    }
    on()
    const onPass = (e: Event) => setYield((e as CustomEvent<boolean>).detail)
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener(PASS_EVENT, onPass)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener(PASS_EVENT, onPass)
    }
  }, [])
  const shown = deep && !yield_
  deepRef.current = shown

  useEffect(() => {
    if (!near || !canvas.current) return
    let alive = true
    let rest: ReturnType<typeof setTimeout> | undefined
    const calm = reduced()
    // crossing state lives outside React: it changes every frame
    const s = { x: Infinity, crossing: false }

    const pose = ({ t, dt, whale, halfW, halfH, swim }: Frame) => {
      // a distant silhouette: about a quarter of the screen on desktop, never dominant on a phone
      const scale = clamp(halfW * 0.24, 0.26, 0.6)
      whale.scale.setScalar(scale)
      const edge = halfW + 1.3 * scale
      // Reduced motion gets the same whale, just an unhurried drift (≈100 s) and a lazy tail
      swim.speed = calm ? 0.7 : 1.6
      swim.amp = calm ? 0.06 : 0.09
      if (!s.crossing) {
        s.crossing = true
        s.x = edge
      }
      s.x -= ((2 * edge) / (calm ? 100 : 40)) * dt
      if (s.x < -edge) {
        // off the left edge: rest out of sight, then swim again if we are still deep
        s.crossing = false
        view.current?.stop()
        rest = setTimeout(() => deepRef.current && view.current?.start(), 7000)
      }
      whale.position.set(s.x, -halfH * 0.18 + Math.sin(t * 0.5) * 0.05, 0)
      whale.rotation.set(Math.sin(t * 0.4) * 0.06, -0.25 + Math.sin(t * 0.3) * 0.05, Math.sin(t * 0.5 + 0.8) * 0.04)
    }

    import('./whale').then(async ({ mountWhale }) => {
      if (!alive || !canvas.current) return
      view.current = await mountWhale(canvas.current, 'deep', pose)
      if (!alive) return view.current.dispose()
      if (deepRef.current) view.current.start()
    })
    return () => {
      alive = false
      clearTimeout(rest)
      view.current?.dispose()
      view.current = null
    }
  }, [near])

  // Start on the way down; on the way up let the fade finish, then stop drawing
  useEffect(() => {
    const v = view.current
    if (!v) return
    if (shown) {
      v.start()
      return
    }
    const t = setTimeout(() => v.stop(), 1200)
    return () => clearTimeout(t)
  }, [shown])

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="absolute inset-0 h-full w-full transition-opacity ease-out"
      style={{ opacity: shown ? 0.24 : 0, transitionDuration: shown ? '1600ms' : '900ms' }}
    />
  )
}

/* ─────────────────────────── 2. Encounters ───────────────────────────
   A band under an expedition. Its animal crosses as you scroll past — position follows the scroll
   (smoothed, so it glides rather than jerks), and the tail beats faster while it moves. */
export function WhalePass({ species }: { species: Species }) {
  const { c } = useLang()
  const ch = CHARACTER[species]
  const label = c.ui.species[species]
  const band = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [load, setLoad] = useState(false)
  const [seen, setSeen] = useState(false)
  // −1 · 0 · +1 → −25° · 0° · +45°; the engine springs toward it
  const [turn, setTurn] = useState(0)
  const turnRef = useRef(0)
  const view = useRef<WhaleView | null>(null)
  useEffect(() => {
    turnRef.current = turn
    view.current?.turnTo(turnDeg(turn))
  }, [turn])

  // Load a screen and a half early; draw only while on screen
  useEffect(() => {
    const el = band.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setLoad(true), { rootMargin: '150% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!load || !canvas.current || !band.current) return
    let alive = true
    let io: IntersectionObserver | undefined
    const calm = reduced()
    const s = { x: NaN }

    const pose = ({ t, dt, whale, halfW, halfH, swim }: Frame) => {
      const scale = Math.min(halfW * 0.5, halfH * 1.6) * ch.size
      whale.scale.setScalar(scale)
      const r = band.current!.getBoundingClientRect()
      const vh = window.innerHeight
      const p = clamp((vh - r.top) / (vh + r.height), 0, 1) // 0 entering from below → 1 leaving at the top
      const edge = halfW + 1.2 * scale
      const target = calm ? 0 : edge - p * 2 * edge
      if (Number.isNaN(s.x)) s.x = target
      const prev = s.x
      s.x += (target - s.x) * (1 - Math.exp(-dt * 3.5)) // critically-damped follow
      const v = Math.abs(s.x - prev) / Math.max(dt, 1e-3)
      swim.speed = calm ? ch.base * 0.4 : ch.base + clamp(v * ch.boost, 0, 2.6)
      swim.amp = calm ? ch.amp * 0.6 : ch.amp
      const heave = Math.sin(t * ch.bobRate) * ch.bob
      whale.position.set(s.x, (Math.sin(p * Math.PI) * ch.arc + heave) * scale, 0)
      // nose follows the heave, so a rise reads as swimming up rather than floating
      const pitch = Math.cos(t * ch.bobRate) * ch.bob * ch.bobRate * 1.2
      whale.rotation.set(Math.sin(t * 0.5) * 0.05, -0.22, calm ? 0 : -Math.cos(p * Math.PI) * 0.07 + pitch)
    }

    import('./whale').then(async ({ mountWhale }) => {
      if (!alive || !canvas.current || !band.current) return
      const v = await mountWhale(canvas.current, 'near', pose, species)
      if (!alive) return v.dispose()
      view.current = v
      v.turnTo(turnDeg(turnRef.current))
      io = new IntersectionObserver(([e]) => {
        announcePass(species, e.isIntersecting)
        if (e.isIntersecting) {
          setSeen(true)
          v.start()
        } else v.stop()
      })
      io.observe(band.current)
      cleanup = () => {
        view.current = null
        v.dispose()
      }
    })
    let cleanup = () => {}
    return () => {
      alive = false
      io?.disconnect()
      announcePass(species, false)
      cleanup()
    }
  }, [load, species, ch])

  return (
    // Full-bleed so the whale can swim in from the very edge; the rule stays on the text grid
    <div ref={band} className="relative -mx-6 sm:-mx-10">
      <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-cream/15 sm:inset-x-10" />
      <canvas
        ref={canvas}
        aria-hidden
        className="block h-[clamp(240px,42vh,440px)] w-full transition-opacity duration-1000 ease-out"
        style={{ opacity: seen ? 1 : 0 }}
      />
      <div className="absolute inset-x-6 bottom-3 flex items-end justify-between gap-4 sm:inset-x-10">
        <p className="flex flex-col gap-0.5 pb-2 text-xs text-cream/45">
          <span className="italic">{label.latin}</span>
          <span>{label.caption}</span>
        </p>
        <div className="flex shrink-0 items-center" role="group" aria-label={label.caption}>
          <TurnButton label={c.ui.turnLeft} disabled={turn <= -1} onClick={() => setTurn((v) => Math.max(-1, v - 1))}>
            <ArrowLeft size={18} strokeWidth={1.5} />
          </TurnButton>
          <TurnButton label={c.ui.turnRight} disabled={turn >= 1} onClick={() => setTurn((v) => Math.min(1, v + 1))}>
            <ArrowRight size={18} strokeWidth={1.5} />
          </TurnButton>
        </div>
      </div>
    </div>
  )
}

function TurnButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    // aria-disabled rather than disabled: at the limit the button keeps keyboard focus instead of dropping it
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className="press flex h-11 w-11 items-center justify-center text-cream/70 transition-opacity hover:text-cream aria-disabled:cursor-default aria-disabled:opacity-25"
    >
      {children}
    </button>
  )
}
