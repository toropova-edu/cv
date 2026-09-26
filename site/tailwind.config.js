/** @type {import('tailwindcss').Config} */
const hn = ['"Helvetica Neue ME"', 'Arimo', 'Helvetica', 'Arial', 'sans-serif']
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // hover: styles only on devices that really hover — no sticky hovers after a tap on phones
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: { cream: '#efeee9' },
      fontFamily: { hn, sans: hn, serif: hn },
      // One set of curves for the whole site (mirrored as CSS vars in index.css)
      transitionTimingFunction: {
        out: 'cubic-bezier(0.23, 1, 0.32, 1)', // entering, hover, press
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)', // things moving/morphing on screen
        drawer: 'cubic-bezier(0.32, 0.72, 0, 1)', // panels, expanding content
      },
    },
  },
  plugins: [],
}
