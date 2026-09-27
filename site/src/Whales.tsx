import { useEffect, useRef, useState } from 'react'
import type { Frame, WhaleView } from './whale'
import { useLang } from './lang'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** metres, same scale as the depth gauge in the header (scrollY / 6) */
const DEPTH = 150
const depthOf = () => window.scrollY / 6

/* One whale on screen at a time: while the Solovki band is visible, the deep one steps back. */
const PASS_EVENT = 'whalepass'
const announcePass = (visible: boolean) => window.dispatchEvent(new CustomEvent(PASS_EVENT, { detail: visible }))

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

/* ─────────────────────────── 2. The Solovki encounter ───────────────────────────
   A band under the Solovki expedition. The beluga crosses it as you scroll past — position follows
   the scroll (smoothed, so it glides rather than jerks), and the tail beats faster while it moves. */
export function WhalePass() {
  const { c } = useLang()
  const band = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [load, setLoad] = useState(false)
  const [seen, setSeen] = useState(false)

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
      const scale = Math.min(halfW * 0.5, halfH * 1.6)
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
      swim.speed = calm ? 0.6 : 1.5 + clamp(v * 1.4, 0, 2.6)
      swim.amp = calm ? 0.06 : 0.1
      whale.position.set(s.x, Math.sin(p * Math.PI) * 0.1 * scale + Math.sin(t * 0.6) * 0.03 * scale, 0)
      whale.rotation.set(Math.sin(t * 0.5) * 0.05, -0.22, calm ? 0 : -Math.cos(p * Math.PI) * 0.07)
    }

    import('./whale').then(async ({ mountWhale }) => {
      if (!alive || !canvas.current || !band.current) return
      const v = await mountWhale(canvas.current, 'near', pose)
      if (!alive) return v.dispose()
      io = new IntersectionObserver(([e]) => {
        announcePass(e.isIntersecting)
        if (e.isIntersecting) {
          setSeen(true)
          v.start()
        } else v.stop()
      })
      io.observe(band.current)
      cleanup = () => v.dispose()
    })
    let cleanup = () => {}
    return () => {
      alive = false
      io?.disconnect()
      announcePass(false)
      cleanup()
    }
  }, [load])

  return (
    // Full-bleed so the whale can swim in from the very edge; the rule stays on the text grid
    <div ref={band} aria-hidden className="relative -mx-6 sm:-mx-10">
      <div className="absolute inset-x-6 top-0 h-px bg-cream/15 sm:inset-x-10" />
      <canvas
        ref={canvas}
        className="block h-[clamp(240px,42vh,440px)] w-full transition-opacity duration-1000 ease-out"
        style={{ opacity: seen ? 1 : 0 }}
      />
      <div className="pointer-events-none absolute inset-x-6 bottom-4 flex justify-between gap-6 text-xs text-cream/45 sm:inset-x-10">
        <span>{c.ui.whaleLatin}</span>
        <span>{c.ui.whalePlace}</span>
      </div>
    </div>
  )
}
