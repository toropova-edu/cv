import { useEffect, useLayoutEffect, useRef } from 'react'
import { About, Education, Experience, Home } from './pages'
import { useLang } from './lang'
import { Chrome, Sea, useRoute } from './ui'

const pages: Record<string, ['about' | 'education' | 'experience', () => React.JSX.Element]> = {
  about: ['about', About],
  education: ['education', Education],
  experience: ['experience', Experience],
  // old links from the previous version
  expeditions: ['experience', Experience],
  hobbies: ['about', About],
}

export default function App() {
  const route = useRoute()
  const { c, lang } = useLang()
  const page = pages[route]
  const Page = page?.[1] ?? Home
  document.title = page ? `${c.pages[page[0]].title} — ${c.ui.title}` : c.ui.marquee

  // Jump to the top only once the new page is in the DOM, so the old one never flashes at the top first
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  // Language switch: a quick blur-crossfade masks the text swap instead of a hard cut.
  // Applied to the header and the page separately — a filter on a common ancestor would
  // break the fixed header for the duration.
  const firstLang = useRef(true)
  useEffect(() => {
    if (firstLang.current) {
      firstLang.current = false
      return
    }
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.querySelectorAll<HTMLElement>('[data-lang-fade]').forEach((el) =>
      el.animate(
        calm ? [{ opacity: 0.4 }, { opacity: 1 }] : [{ opacity: 0.4, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0)' }],
        { duration: 260, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
      ),
    )
  }, [lang])

  return (
    <div className="min-h-[100dvh] bg-black text-cream">
      {page && <Sea />}
      <Chrome key={page ? 'page' : 'home'} route={route} overlay={!page} />
      {/* key re-mounts the page so its entrance plays on every navigation */}
      <div key={route} data-lang-fade className="relative z-10">
        <Page />
      </div>
    </div>
  )
}
