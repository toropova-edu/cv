/** @type {import('tailwindcss').Config} */
const hn = ['"Helvetica Neue ME"', 'Arimo', 'Helvetica', 'Arial', 'sans-serif']
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { cream: '#efeee9' },
      fontFamily: { hn, sans: hn, serif: hn },
    },
  },
  plugins: [],
}
