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
        background: '#0A0A0F',
        brand: {
          DEFAULT: '#6366F1',
          light: '#818CF8',
          dark: '#4F46E5',
        },
        surface: {
          DEFAULT: '#13131A',
          elevated: '#1C1C26',
        },
        'text-primary': '#F8F8FF',
        'text-secondary': '#A0A0B8',
        'text-muted': '#60607A',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
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
        heading: ['Inter', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        'lp-serif': ['"Newsreader Variable"', 'Georgia', 'serif'],
        'lp-sans': ['"IBM Plex Sans"', '"Apple SD Gothic Neo"', '"Malgun Gothic"', 'system-ui', 'sans-serif'],
        'lp-mono': ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
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
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(99,102,241,0.6)' },
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
        'brand-gradient': 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        'hero-gradient': 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        glow: '0 0 30px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 60px rgba(99,102,241,0.4)',
        'lp-lift': '0 1px 2px rgba(27,29,28,0.05), 0 12px 32px rgba(27,29,28,0.07)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config
