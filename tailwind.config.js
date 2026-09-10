/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./App.jsx",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-code)', 'monospace'],
      },
      colors: {
        // Minimal Colors palette by Dumma Branding:
        dumma: {
          cyan: '#51E2F5',    // Electric Cyan
          mint: '#9DF9EF',    // Soft Aqua Mint
          ice: '#EDF7F6',     // Pale Ice White
          coral: '#FFA8B6',   // Pastel Coral Pink
          mauve: '#A28089',   // Muted Slate Mauve / Dusty Rose Plum
          dark: '#1B1618',    // Deep Plum Slate (Dark base)
          cardDark: '#251E22', // Dark Card Surface
          borderDark: '#3E3137', // Dark Border
          textDark: '#362B30', // Deep Plum for Light Mode Text
        }
      }
    },
  },
  plugins: [],
}
