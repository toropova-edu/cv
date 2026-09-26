import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { content, type Content, type Lang } from './data'

const KEY = 'lang'

function initial(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'ru') return saved
  } catch {
    /* storage blocked — fall through */
  }
  return navigator.language?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; c: Content }>({
  lang: 'en',
  setLang: () => {},
  c: content.en,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initial)
  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, c: content[lang] }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** EN / RU switch; the current language is marked, the other is one tap away */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, c } = useLang()
  return (
    <div role="group" aria-label={c.ui.language} className={`flex items-center gap-1.5 ${className}`}>
      {(['en', 'ru'] as const).map((l, i) => (
        <span key={l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-cream/30">/</span>}
          <button
            type="button"
            lang={l}
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={`press uppercase transition-opacity duration-300 ${lang === l ? 'opacity-100' : 'opacity-45 hover:opacity-80'}`}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  )
}
