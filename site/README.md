# Site source

The site at https://toropova-edu.github.io/cv/ is built from this folder
(Vite + React + TypeScript + Tailwind). GitHub Pages serves the repository root of `main`,
so the build writes straight there.

```bash
cd site
npm ci
npm run dev     # local preview
npm run build   # writes index.html, assets/ and favicon.svg to the repo root
```

Commit both `site/` and the rebuilt files in the root.

- Texts in both languages: `src/data.ts`
- Map of places: `src/ExpeditionMap.tsx` (coordinates in `src/map.ts`)
- Images: `public/assets/images/`
