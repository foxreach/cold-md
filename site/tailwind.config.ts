import type { Config } from 'tailwindcss'

// FoxReach palette (frontend/public/brand/kit/README.md, 2026-10-29) and the
// marketing site's type: Inter Display headlines with an Instrument Serif
// italic accent, Inter body, JetBrains Mono for commands.
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#000000', 2: '#333333', 3: '#666666', 4: '#8C8C8C' },
        page: '#FFFFFF',
        panel: '#F7F7F7',
        grey: '#F2F2F2',
        line: '#EBEBEB',
        night: { DEFAULT: '#0B0B0B', 2: '#151515', 3: '#1F1F1F', line: '#2A2A2A' },
        fox: {
          DEFAULT: '#EA580C',
          hover: '#D24E0A',
          light: '#FBDECE',
          tint: '#FFF4EE',
          deep: '#C2410C',
        },
        good: '#16A34A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter-display)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(2.75rem, 7.2vw, 5.25rem)', { lineHeight: '1.0', letterSpacing: '-0.045em' }],
        h2: ['clamp(2rem, 4.4vw, 3.25rem)', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
        lift: '0 1px 2px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)',
        window: '0 2px 6px rgba(0,0,0,0.06), 0 28px 64px rgba(0,0,0,0.12)',
        cta: '0 8px 24px rgba(234,88,12,0.35)',
      },
      keyframes: {
        blink: { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0' } },
        rise: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
        rise: 'rise .35s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
