import { useLayoutEffect, useRef } from 'react'
import { useLang } from './lang'
import { keldyshBack, keldyshOut, seas } from './map'

/**
 * The 95th voyage of R/V Akademik Mstislav Keldysh: Kaliningrad → along Norway → Novaya Zemlya,
 * then back to Murmansk. Hidden until asked for (a voyage pin or the "show route" button), then
 * drawn as a chart-style dashed course with a small ship riding the tip; the return leg is dotted.
 */

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Line styles in map units: [dash, gap]. The return leg is dotted. */
const COURSE = [3, 2.2] as const
const DOTS = [0.4, 2.2] as const

/**
 * A dash pattern that is only "inked" up to `drawn` along the path, then one long gap.
 * Draws a dashed line in progressively without an SVG mask (masks + pathLength are unreliable in Chrome).
 */
function dashUpTo(total: number, drawn: number, [on, off]: readonly [number, number]) {
  if (drawn <= 0) return `0 ${total + 1}`
  const parts: number[] = []
  let acc = 0
  while (acc < drawn) {
    const d = Math.min(on, drawn - acc)
    parts.push(d)
    acc += d
    if (acc >= drawn) break
    const g = Math.min(off, drawn - acc)
    parts.push(g)
    acc += g
  }
  if (parts.length % 2 === 0) parts.push(0) // keep dash/gap parity so the tail below is a gap
  parts.push(total + 1)
  return parts.map((n) => n.toFixed(2)).join(' ')
}

/**
 * A voyage leg sailed at a steady cruise: eases up to speed, holds it, eases into port.
 * Trapezoidal speed profile → the distance curve has no kinks, so the ship never lurches.
 */
function leg(length: number, cruise: number, ramp: number) {
  const T = length / cruise + ramp
  const at = (t: number) => {
    if (t <= 0) return 0
    if (t >= T) return length
    if (t < ramp) return (cruise * t * t) / (2 * ramp)
    if (t > T - ramp) return length - (cruise * (T - t) * (T - t)) / (2 * ramp)
    return cruise * (t - ramp / 2)
  }
  return { T, at }
}

/**
 * Easter egg: the Norwegian Sea's own legend. Off Lofoten, a little way seaward of the route, a kraken
 * surfaces as the ship goes by, waves, and slips back under. (Map units, Robinson projection.)
 */
const LAIR = { x: 92.3, y: 61.3 }
const KRAKEN = { lead: 18, rise: 0.75, hold: 2.3, sink: 0.55 } // lead: map units before the ship is abeam

/**
 * Four arms, drawn for the right-hand side (side = −1 mirrors them to the left). Two high ones wave from the
 * flanks of the head, two lower ones lie out on the water; every tip curls. Paths run from the arm's root.
 */
const TENTACLES = [
  { d: 'M0 0 C1.8 -2.6 5 -3 5.8 -6.4 C6.4 -9.2 4.4 -10.8 3.1 -9.8', base: [3, -1.6], rot: 8, amp: 14, f: 2.0, ph: 0.0, side: 1 },
  { d: 'M0 0 C1.8 -2.6 5 -3 5.8 -6.4 C6.4 -9.2 4.4 -10.8 3.1 -9.8', base: [-3, -1.6], rot: 8, amp: 14, f: 2.4, ph: 2.4, side: -1 },
  { d: 'M0 0 C2.2 -0.5 4.4 0.1 5.8 -1.6 C6.8 -2.9 6 -4.3 4.8 -3.9', base: [3.4, -0.5], rot: 0, amp: 7, f: 1.7, ph: 1.2, side: 1 },
  { d: 'M0 0 C2.2 -0.5 4.4 0.1 5.8 -1.6 C6.8 -2.9 6 -4.3 4.8 -3.9', base: [-3.4, -0.5], rot: 0, amp: 7, f: 1.9, ph: 3.6, side: -1 },
] as const

/** shortest signed difference between two angles (radians) */
const turnBy = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from))

/** Lives inside the map <svg>. */
export function RouteSvg({ shown }: { shown: boolean }) {
  const outRef = useRef<SVGPathElement>(null)
  const backRef = useRef<SVGPathElement>(null)
  const wakes = useRef<(SVGPathElement | null)[]>([])
  const ship = useRef<SVGGElement>(null)
  const kraken = useRef<SVGGElement>(null)
  const krakenBody = useRef<SVGGElement>(null)
  const ripple = useRef<SVGEllipseElement>(null)
  const arms = useRef<(SVGGElement | null)[]>([])

  // layout effect: the dash pattern must be in place before the first paint, or the full route flashes
  useLayoutEffect(() => {
    const out = outRef.current
    const back = backRef.current
    if (!out || !back) return
    const lenOut = out.getTotalLength()
    const lenBack = back.getTotalLength()
    const [nearOut, farOut, nearBack, farBack] = wakes.current

    const draw = (dOut: number, dBack: number) => {
      out.setAttribute('stroke-dasharray', dashUpTo(lenOut, dOut, COURSE))
      back.setAttribute('stroke-dasharray', dashUpTo(lenBack, dBack, DOTS))
    }
    // the wake: a short bright segment and a longer faint one trailing the ship, ending exactly at it
    const wake = (near: SVGPathElement | null | undefined, far: SVGPathElement | null | undefined, d: number, fade: number) => {
      const set = (el: SVGPathElement | null | undefined, W: number, o: number) => {
        if (!el) return
        el.setAttribute('stroke-dasharray', `${W} 100000`)
        el.setAttribute('stroke-dashoffset', String(-(d - W)))
        el.setAttribute('opacity', String(o * fade))
      }
      set(near, 9, 0.75)
      set(far, 26, 0.28)
    }
    const hideWakes = () => wakes.current.forEach((w) => w?.setAttribute('opacity', '0'))

    if (!shown) {
      // stays drawn while the group fades out; reset once hidden
      const t = setTimeout(() => {
        draw(0, 0)
        hideWakes()
        ship.current?.setAttribute('opacity', '0')
        kraken.current?.setAttribute('opacity', '0')
      }, 300)
      return () => clearTimeout(t)
    }

    // Distance-based timing: same cruising speed on both legs (map units per second).
    // Played in reduced-motion mode too — it only runs when the visitor asks for it, and it is slow and calm.
    const CRUISE = 62
    const RAMP = 0.8
    const PAUSE = 0.8 // at Novaya Zemlya: stop, come about
    const PORT = 0.7 // in Murmansk: fade out
    const L1 = leg(lenOut, CRUISE, RAMP)
    const L2 = leg(lenBack, CRUISE, RAMP)

    // the point of the outbound leg nearest the lair: the kraken surfaces as the ship approaches it
    let dLair = 0
    let best = Infinity
    for (let d = 0; d <= lenOut; d += 2) {
      const p = out.getPointAtLength(d)
      const q = (p.x - LAIR.x) ** 2 + (p.y - LAIR.y) ** 2
      if (q < best) {
        best = q
        dLair = d
      }
    }
    let krakenAt = -1 // timestamp (ms) when it began to surface

    const drawKraken = (now: number) => {
      const k = kraken.current
      if (!k) return
      if (krakenAt < 0) return
      const t = (now - krakenAt) / 1000
      const { rise, hold, sink } = KRAKEN
      const total = rise + hold + sink
      if (t > total) {
        k.setAttribute('opacity', '0')
        return
      }
      // out of the water on an ease-out; back under on an ease-in
      const up = t < rise ? 1 - Math.pow(1 - t / rise, 3) : t < rise + hold ? 1 : Math.pow(1 - (t - rise - hold) / sink, 2)
      k.setAttribute('opacity', '1')
      krakenBody.current?.setAttribute('transform', `translate(0 ${(1 - up) * 12})`)
      // the surface ripples outward as it breaks
      const r = clamp01(t / 1.4)
      ripple.current?.setAttribute('rx', String(3 + r * 9))
      ripple.current?.setAttribute('ry', String(0.9 + r * 2.2))
      ripple.current?.setAttribute('opacity', String((1 - r) * 0.55 * (t < total - 0.2 ? 1 : 0)))
      // a wave hello: arms sway out of phase, and the outer pair lifts higher while it holds
      const wave = t > rise * 0.6 && t < rise + hold ? Math.sin(Math.min(1, (t - rise * 0.6) / 0.5) * Math.PI * 0.5) : 0
      TENTACLES.forEach((a, i) => {
        const sway = Math.sin(t * a.f * 3.1 + a.ph) * a.amp * (0.45 + 0.55 * wave)
        arms.current[i]?.setAttribute('transform', `translate(${a.base[0]} ${a.base[1]}) scale(${a.side} 1) rotate(${a.rot + sway})`)
      })
    }

    const heading = { a: NaN }
    const headingAt = (path: SVGPathElement, len: number, d: number, dir = 1) => {
      const a = path.getPointAtLength(Math.max(0, Math.min(len, d - 1.2)))
      const b = path.getPointAtLength(Math.max(0, Math.min(len, d + 1.2)))
      return Math.atan2((b.y - a.y) * dir, (b.x - a.x) * dir)
    }
    const place = (path: SVGPathElement, len: number, d: number, target: number, dt: number, opacity: number) => {
      const p = path.getPointAtLength(Math.max(0, Math.min(len, d)))
      // the hull follows the course through a soft follow, so bends read as turns, not snaps
      heading.a = Number.isNaN(heading.a) ? target : heading.a + turnBy(heading.a, target) * (1 - Math.exp(-dt * 10))
      ship.current?.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${(heading.a * 180) / Math.PI})`)
      ship.current?.setAttribute('opacity', String(opacity))
    }

    const t0 = performance.now()
    let last = t0
    let raf = 0
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (s < L1.T) {
        const d = L1.at(s)
        if (krakenAt < 0 && d >= dLair - KRAKEN.lead) krakenAt = now
        draw(d, 0)
        wake(nearOut, farOut, d, 1)
        place(out, lenOut, d, headingAt(out, lenOut, d), dt, clamp01(s / 0.35))
      } else if (s < L1.T + PAUSE) {
        // stopped: the wake settles, the bow swings round toward Murmansk
        const k = (s - L1.T) / PAUSE
        draw(lenOut, 0)
        wake(nearOut, farOut, lenOut, 1 - k)
        place(out, lenOut, lenOut, headingAt(back, lenBack, 0), dt * easeInOut(k) * 0.6, 1)
      } else if (s < L1.T + PAUSE + L2.T) {
        const d = L2.at(s - L1.T - PAUSE)
        draw(lenOut, d)
        wake(nearOut, farOut, lenOut, 0)
        wake(nearBack, farBack, d, 1)
        place(back, lenBack, d, headingAt(back, lenBack, d), dt, 1)
      } else {
        const k = clamp01((s - L1.T - PAUSE - L2.T) / PORT)
        draw(lenOut, lenBack)
        wake(nearBack, farBack, lenBack, 1 - k)
        place(back, lenBack, lenBack, heading.a, dt, 1 - k)
        if (k >= 1) {
          drawKraken(now)
          return
        }
      }
      drawKraken(now)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shown])

  const wakePath = (d: string, i: number, w: number) => (
    <path
      ref={(el) => void (wakes.current[i] = el)}
      d={d}
      fill="none"
      stroke="#8fd6dd"
      strokeWidth={w}
      strokeLinecap="round"
      opacity={0}
    />
  )

  return (
    <g aria-hidden className="transition-opacity duration-300 ease-out" style={{ opacity: shown ? 1 : 0 }}>
      <defs>
        {/* everything below the waterline (local y > 0) is cut away */}
        <clipPath id="kraken-clip" clipPathUnits="userSpaceOnUse">
          <rect x={-16} y={-24} width={32} height={24.4} />
        </clipPath>
      </defs>
      <path ref={outRef} d={keldyshOut} fill="none" stroke="#efeee9" strokeOpacity={0.75} strokeWidth={0.75} strokeLinecap="round" />
      <path ref={backRef} d={keldyshBack} fill="none" stroke="#efeee9" strokeOpacity={0.5} strokeWidth={0.75} strokeLinecap="round" />
      {wakePath(keldyshOut, 1, 2.2)}
      {wakePath(keldyshOut, 0, 1.2)}
      {wakePath(keldyshBack, 3, 2.2)}
      {wakePath(keldyshBack, 2, 1.2)}
      {/* the kraken: clipped at the waterline so it rises out of the sea */}
      <g ref={kraken} opacity={0} transform={`translate(${LAIR.x} ${LAIR.y})`} clipPath="url(#kraken-clip)">
        <ellipse ref={ripple} cx={0} cy={0} rx={3} ry={0.9} fill="none" stroke="#8fd6dd" strokeWidth={0.5} opacity={0} />
        <g ref={krakenBody}>
          {/* tentacles first, so the mantle overlaps their roots */}
          {TENTACLES.map((a, i) => (
            <g key={i} ref={(el) => void (arms.current[i] = el)} transform={`translate(${a.base[0]} ${a.base[1]}) scale(${a.side} 1) rotate(${a.rot})`}>
              <path d={a.d} fill="none" stroke="#efeee9" strokeWidth={1.5} strokeLinecap="round" />
            </g>
          ))}
          {/* mantle: a dome */}
          <path d="M-4.2 0.5 C-4.8 -5.6 -2.7 -11.2 0 -11.2 C2.7 -11.2 4.8 -5.6 4.2 0.5 Z" fill="#efeee9" />
          <circle cx={-1.7} cy={-5.6} r={1.25} fill="#0a0a0a" />
          <circle cx={1.7} cy={-5.6} r={1.25} fill="#0a0a0a" />
          <circle cx={-1.35} cy={-6} r={0.4} fill="#efeee9" />
          <circle cx={2.05} cy={-6} r={0.4} fill="#efeee9" />
          {/* a small smile */}
          <path d="M-1.3 -2.9 Q0 -1.7 1.3 -2.9" fill="none" stroke="#0a0a0a" strokeWidth={0.4} strokeLinecap="round" />
        </g>
      </g>
      {/* the ship, seen from above, bow along +x; rotated to the course */}
      <g ref={ship} opacity={0}>
        <circle r={5.5} fill="#8fd6dd" opacity={0.16} />
        <path d="M3.4 0 C2 -1.5 -1.6 -1.55 -2.7 -1.15 L-2.7 1.15 C-1.6 1.55 2 1.5 3.4 0 Z" fill="#efeee9" />
      </g>
    </g>
  )
}

/** Sea names that fade in with the route; HTML so the type stays crisp at any size. */
export function SeaLabels({ shown }: { shown: boolean }) {
  const { c } = useLang()
  return (
    <>
      {(Object.keys(seas) as (keyof typeof seas)[]).map((k, i) => (
        <span
          key={k}
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[0.625rem] italic tracking-[0.08em] text-cream/40 transition-opacity ease-out"
          style={{
            left: `${seas[k][0]}%`,
            top: `${seas[k][1]}%`,
            opacity: shown ? 1 : 0,
            transitionDelay: shown ? `${400 + i * 500}ms` : '0ms',
            transitionDuration: shown ? '700ms' : '200ms',
          }}
        >
          {c.ui.route.seas[k]}
        </span>
      ))}
    </>
  )
}

/** Key under the map: what the two strokes mean. Shown with the route. */
export function RouteLegend({ shown }: { shown: boolean }) {
  const { c } = useLang()
  const r = c.ui.route
  return (
    <div
      aria-hidden={!shown}
      className="grid transition-[grid-template-rows,opacity] duration-300 ease-drawer"
      style={{ gridTemplateRows: shown ? '1fr' : '0fr', opacity: shown ? 1 : 0 }}
    >
      <div className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs text-cream/55">
          <span className="text-cream/80">{r.title}</span>
          <span className="flex items-center gap-2">
            <svg width="28" height="4" aria-hidden>
              <line x1="1" y1="2" x2="27" y2="2" stroke="#efeee9" strokeOpacity={0.75} strokeWidth={1.2} strokeDasharray="5 3.5" />
            </svg>
            {r.out}
          </span>
          <span className="flex items-center gap-2">
            <svg width="28" height="4" aria-hidden>
              <line x1="1" y1="2" x2="27" y2="2" stroke="#efeee9" strokeOpacity={0.6} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="0.5 3.5" />
            </svg>
            {r.back}
          </span>
        </div>
      </div>
    </div>
  )
}
