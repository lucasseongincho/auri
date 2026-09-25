import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // App-wide tokens, same system as the landing page (lp-*).
        background: '#F4F2EC',
        brand: {
          DEFAULT: '#1F5C4A',
          light: '#EEF3F0',
          dark: '#15443A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FAF9F5',
        },
        'text-primary': '#1B1D1C',
        'text-secondary': '#3C403E',
        'text-muted': '#5A5F5C',
        success: '#1F7A4D',
        warning: '#8A5A00',
        error: '#B42318',
        // Landing page (app/page.tsx) only. Paper + ink neutrals, one brand
        // green, one highlight used solely to mark matched keywords.
        lp: {
          paper: '#F4F2EC',
          sunk: '#E9E6DD',
          sheet: '#FAF9F5',
          rule: '#D9D5CC',
          hairline: '#E6E2D9',
          ink: '#1B1D1C',
          body: '#3C403E',
          muted: '#5A5F5C',
          pine: '#1F5C4A',
          'pine-dark': '#15443A',
          'pine-tint': '#EEF3F0',
          mark: '#F2D45C',
          miss: '#9A3B12',
        },
      },
      fontFamily: {
        heading: ['"Newsreader Variable"', '"Noto Serif KR"', 'Georgia', 'serif'],
        body: ['"IBM Plex Sans"', '"IBM Plex Sans KR"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'system-ui', 'sans-serif'],
        'lp-serif': ['"Newsreader Variable"', '"Noto Serif KR"', 'Georgia', 'serif'],
        'lp-sans': ['"IBM Plex Sans"', '"IBM Plex Sans KR"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'system-ui', 'sans-serif'],
        'lp-mono': ['"IBM Plex Mono"', '"IBM Plex Sans KR"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'lp-control': '4px',
        'lp-panel': '10px',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out forwards',
        'slide-up': 'slideUp 0.5s ease-in-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        // Kept as flat fills so any remaining references stay valid.
        'brand-gradient': 'linear-gradient(#1F5C4A, #1F5C4A)',
        'hero-gradient': 'none',
      },
      boxShadow: {
        glow: 'none',
        'glow-lg': 'none',
        'lp-lift': '0 1px 2px rgba(27,29,28,0.05), 0 12px 32px rgba(27,29,28,0.07)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
