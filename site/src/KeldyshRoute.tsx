import { useLayoutEffect, useRef } from 'react'
import { useLang } from './lang'
import { keldyshBack, keldyshOut, seas } from './map'

/**
 * The 95th voyage of R/V Akademik Mstislav Keldysh: Kaliningrad → along Norway → Novaya Zemlya,
 * then back to Murmansk. Hidden until asked for (a voyage pin or the "show route" button), then
 * drawn as a chart-style dashed course with a small ship riding the tip; the return leg is dotted.
 */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

/** Lives inside the map <svg>. */
export function RouteSvg({ shown }: { shown: boolean }) {
  const outRef = useRef<SVGPathElement>(null)
  const backRef = useRef<SVGPathElement>(null)
  const ship = useRef<SVGGElement>(null)

  // layout effect: the dash pattern must be in place before the first paint, or the full route flashes
  useLayoutEffect(() => {
    const out = outRef.current
    const back = backRef.current
    if (!out || !back) return
    const lenOut = out.getTotalLength()
    const lenBack = back.getTotalLength()
    const draw = (uOut: number, uBack: number) => {
      out.setAttribute('stroke-dasharray', dashUpTo(lenOut, uOut * lenOut, COURSE))
      back.setAttribute('stroke-dasharray', dashUpTo(lenBack, uBack * lenBack, DOTS))
    }
    const setShip = (path: SVGPathElement, len: number, u: number, opacity: number) => {
      const p = path.getPointAtLength(clamp01(u) * len)
      ship.current?.setAttribute('transform', `translate(${p.x} ${p.y})`)
      ship.current?.setAttribute('opacity', String(opacity))
    }

    if (!shown) {
      // stays drawn while the group fades out; reset once hidden
      const t = setTimeout(() => {
        draw(0, 0)
        ship.current?.setAttribute('opacity', '0')
      }, 300)
      return () => clearTimeout(t)
    }
    if (reduced()) {
      draw(1, 1)
      ship.current?.setAttribute('opacity', '0')
      return
    }

    // out ≈ 2.6 s, back ≈ 1.1 s; the ship rides the tip and fades out in port
    const OUT = 2.6
    const BACK = 1.1
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const s = (now - t0) / 1000
      const uo = easeInOut(clamp01(s / OUT))
      const ub = easeInOut(clamp01((s - OUT) / BACK))
      draw(uo, ub)
      if (s < OUT) setShip(out, lenOut, uo, 1)
      else setShip(back, lenBack, ub, s < OUT + BACK ? 1 : 1 - clamp01((s - OUT - BACK) / 0.5))
      if (s < OUT + BACK + 0.6) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shown])

  return (
    <g aria-hidden className="transition-opacity duration-300 ease-out" style={{ opacity: shown ? 1 : 0 }}>
      <path ref={outRef} d={keldyshOut} fill="none" stroke="#efeee9" strokeOpacity={0.75} strokeWidth={0.75} strokeLinecap="round" />
      <path ref={backRef} d={keldyshBack} fill="none" stroke="#efeee9" strokeOpacity={0.5} strokeWidth={0.75} strokeLinecap="round" />
      {/* the ship: a dot with a soft halo */}
      <g ref={ship} opacity={0}>
        <circle r={6} fill="#8fd6dd" opacity={0.18} />
        <circle r={2.2} fill="#efeee9" />
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
