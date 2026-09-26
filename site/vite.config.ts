import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves the repository root of `main` (toropova-edu.github.io/cv/),
// so the build is written straight to the repo root. Relative base keeps it working under /cv/.
// emptyOutDir is off so the PDF, cv-one-page.html and old images next to it are left alone.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: '..', emptyOutDir: false },
})
