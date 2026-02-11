import plugin from 'tailwindcss/plugin'
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 1. חיבור הפונטים מה-Layout
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        serif: ['var(--font-playfair)', 'ui-serif', 'Georgia'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        // אנימציית ה-Wave לכותרת "On the Menu"
        wave: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '10%': { transform: 'translateY(-10%)', opacity: '1' },
          '30%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        // אנימציית ה-Pop-in לשם המסעדה ב-Hero
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      },
      animation: {
        'wave-letters': 'wave 6s ease-in-out infinite',
        'pop-in': 'pop-in 0.5s cubic-bezier(0.26, 0.53, 0.74, 1.48) forwards',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        // צל טקסט מודרני ועדין (החלפתי את הלהבות בצל אלגנטי יותר שמתאים למסעדה)
        '.text-shadow-modern': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
        },
        // הצל המקורי שלך (אם תרצה לשמור על אפקט ה"אש" לכותרות מסוימות)
        '.text-shadow-fire': {
          textShadow: '0 -1px 4px #FFF, 0 -2px 10px #ff0, 0 -10px 20px #ff8000, 0 -18px 40px #F00',
        },
      })
    }),
  ],
}

export default config