import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: '#070710',
        card: '#0d0d1a',
        border: '#181828',
        surface: '#10101e',
        muted: '#52527a',
        text: '#e8e8f0',
        green: {
          DEFAULT: '#7fff6e',
          dim: '#7fff6e33',
        },
        blue: {
          DEFAULT: '#4f9eff',
          dim: '#4f9eff33',
        },
        red: {
          DEFAULT: '#ff6b6b',
          dim: '#ff6b6b33',
        },
        orange: {
          DEFAULT: '#ffb347',
          dim: '#ffb34733',
        },
        purple: {
          DEFAULT: '#b97fff',
          dim: '#b97fff33',
        },
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
} satisfies Config
