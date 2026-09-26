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
  const { c } = useLang()
  const page = pages[route]
  const Page = page?.[1] ?? Home
  document.title = page ? `${c.pages[page[0]].title} — ${c.ui.title}` : c.ui.marquee

  return (
    <div className="min-h-[100dvh] bg-black text-cream">
      {page && <Sea />}
      <Chrome key={page ? 'page' : 'home'} route={route} overlay={!page} />
      {/* key re-mounts the page so its entrance plays on every navigation */}
      <div key={route} className="relative z-10">
        <Page />
      </div>
    </div>
  )
}
