import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { Place } from './data'
import { useLang } from './lang'
import { MAP_H, MAP_W, graticule, land, pins, visited } from './map'

// Which side of the dot the label sits on, so the crowded White Sea cluster stays readable
const side: Record<string, 'left' | 'right' | 'top' | 'bottom'> = {
  'St Andrews': 'bottom',
  Kaliningrad: 'left',
  Solovki: 'left',
  Vladivostok: 'left',
}

const labelPos = {
  right: 'left-full top-1/2 -translate-y-1/2 -ml-2.5',
  left: 'right-full top-1/2 -translate-y-1/2 -mr-2.5',
  top: 'bottom-full left-1/2 -translate-x-1/2 -mb-3',
  bottom: 'top-full left-1/2 -translate-x-1/2 -mt-3',
}

export function ExpeditionMap() {
  const { c } = useLang()
  const [sel, setSel] = useState<string | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const [shownId, setShownId] = useState<string | null>(null)
  const leaving = sel === null && shownId !== null
  useEffect(() => {
    if (sel) return setShownId(sel)
    const t = setTimeout(() => setShownId(null), 150)
    return () => clearTimeout(t)
  }, [sel])
  const place = c.places.find((p) => p.id === (sel ?? shownId))

  useEffect(() => {
    if (!sel) return
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setSel(null)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSel(null)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [sel])

  // Chosen from the list on a phone: pan the chart so the pin is in view, then bring map + card on screen
  const choose = (id: string) => {
    setSel(id)
    const el = scroller.current
    if (el && el.scrollWidth > el.clientWidth) {
      const x = (pins[id][0] / 100) * el.scrollWidth
      el.scrollTo({ left: x - el.clientWidth / 2, behavior: 'smooth' })
    }
    box.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return (
    <div ref={box} className="scroll-mt-28">
      {/* On phones the chart pans sideways under the finger instead of shrinking to unreadable */}
      <div
        ref={scroller}
        role="region"
        aria-label={c.ui.mapLabel}
        tabIndex={0}
        className="map-fade -mx-6 overflow-x-auto overscroll-x-contain px-6 outline-none [scrollbar-width:none] focus-visible:ring-1 focus-visible:ring-cream/40 sm:mx-0 sm:overflow-visible sm:px-0"
      >
        <div className="relative min-w-[900px] sm:min-w-0" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" aria-hidden>
            <path d={graticule} fill="none" stroke="#efeee9" strokeOpacity={0.09} strokeWidth={0.4} strokeDasharray="1.5 2.5" />
            <path d={land} fill="#efeee9" fillOpacity={0.06} stroke="#efeee9" strokeOpacity={0.16} strokeWidth={0.35} />
            <path d={visited} fill="#efeee9" fillOpacity={0.13} stroke="#efeee9" strokeOpacity={0.28} strokeWidth={0.35} />
          </svg>

          {c.places.map((p, i) => {
            const [x, y] = pins[p.id]
            const active = sel === p.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                aria-label={`${p.name} — ${p.region}`}
                onClick={() => setSel(active ? null : p.id)}
                // 44 px hit area around an 8 px dot
                className="group absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${x}%`, top: `${y}%`, zIndex: active ? 20 : 10 }}
              >
                <span className="relative block h-2 w-2">
                  <span className="sonar absolute inset-0 rounded-full border border-cream" style={{ animationDelay: `${i * 0.37}s` }} />
                  <span
                    className={`absolute inset-0 rounded-full bg-cream transition-transform duration-200 ease-out group-active:scale-75 ${
                      active ? 'scale-[1.6]' : ''
                    }`}
                  />
                </span>
                <span
                  className={`pointer-events-none absolute whitespace-nowrap text-xs tracking-wide transition-opacity duration-200 ease-out ${
                    active ? 'opacity-100' : 'opacity-65 group-hover:opacity-100'
                  } ${labelPos[side[p.id] ?? 'right']}`}
                >
                  {p.name}
                </span>
              </button>
            )
          })}

          {place && (
            <div className="pointer-events-none absolute inset-0 z-30 hidden sm:block">
              <Card key={place.id} place={place} onClose={() => setSel(null)} leaving={leaving} anchored />
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-xs text-cream/45">
        {sel ? c.ui.mapHintOpen : c.ui.mapHint}
        <span className="sm:hidden"> · {c.ui.mapSwipe}</span>
      </p>

      {/* Phone: card sits under the chart, then a plain list with full-size tap targets */}
      <div className="sm:hidden" aria-live="polite">
        {place && (
          <div className="mt-4">
            <Card key={place.id} place={place} onClose={() => setSel(null)} leaving={leaving} />
          </div>
        )}
      </div>
      <div className="mt-8 sm:hidden">
        <p className="text-xs uppercase tracking-[0.2em] text-cream/55">{c.ui.mapList}</p>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 border-t border-cream/15">
          {c.places.map((p) => (
            <li key={p.id} className="border-b border-cream/15">
              <button
                type="button"
                aria-pressed={sel === p.id}
                onClick={() => choose(p.id)}
                className={`press flex min-h-12 w-full items-center gap-2 text-left text-sm ${
                  sel === p.id ? '' : 'opacity-70'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full bg-cream transition-opacity duration-200 ease-out ${sel === p.id ? 'opacity-100' : 'opacity-30'}`}
                />
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Card({
  place,
  onClose,
  leaving,
  anchored = false,
}: {
  place: Place
  onClose: () => void
  leaving: boolean
  anchored?: boolean
}) {
  const { c } = useLang()
  let style: React.CSSProperties = {}
  const W = 400
  if (anchored) {
    // Grow out of the pin that opened it: pick the side with room, and set transform-origin on the pin
    const [x, y] = pins[place.id]
    const below = y < 50
    const h = x > 68 ? 'right' : x < 18 ? 'left' : 'center'
    style = {
      position: 'absolute',
      width: W,
      ...(below ? { top: `calc(${y}% + 16px)` } : { bottom: `calc(${100 - y}% + 16px)` }),
      ...(h === 'right'
        ? { right: `calc(${100 - x}% - 20px)` }
        : h === 'left'
          ? { left: `calc(${x}% - 20px)` }
          : { left: `clamp(0px, calc(${x}% - ${W / 2}px), calc(100% - ${W}px))` }),
      transformOrigin: `${h === 'right' ? `${W - 20}px` : h === 'left' ? '20px' : `${W / 2}px`} ${below ? 'top' : 'bottom'}`,
    }
  }
  return (
    <div
      role="dialog"
      aria-label={place.name}
      style={style}
      className={`${leaving ? 'anim-pop-out pointer-events-none' : 'anim-pop pointer-events-auto'} overflow-hidden border border-cream/10 bg-[#141414]/85 shadow-2xl shadow-black/60 backdrop-blur-xl ${
        anchored ? 'flex' : ''
      }`}
    >
      {place.img && (
        <img
          src={place.img}
          alt={place.name}
          className={`object-cover grayscale transition-[filter] duration-500 ease-out hover:grayscale-0 ${
            anchored ? 'w-36 shrink-0 self-stretch' : 'aspect-[16/9] w-full'
          }`}
        />
      )}
      <div className="relative min-w-0 flex-1 p-5">
        <button
          type="button"
          aria-label={c.ui.close}
          onClick={onClose}
          className="press absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-cream/60 hover:text-cream"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
        <p className="pr-8 text-[0.6875rem] uppercase tracking-[0.2em] text-cream/50">{place.region}</p>
        <h3 className="mt-2 font-hn text-2xl tracking-[-0.02em]">{place.name}</h3>
        <p className="mt-1 text-[0.6875rem] tabular-nums text-cream/45">{place.coords}</p>
        <p className="mt-3 text-sm leading-relaxed text-cream/75">{place.text}</p>
      </div>
    </div>
  )
}
