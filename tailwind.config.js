/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: '#e8c4a0',
          dark: '#8b5e3c',
          glow: 'rgba(200, 149, 108, 0.3)',
        },
        accent: {
          DEFAULT: '#e07b39',
          light: '#f4a261',
        },
        card: {
          DEFAULT: '#16161f',
          hover: '#1c1c28',
        },
        elevated: '#1e1e2a',
        glass: 'rgba(22, 22, 31, 0.85)',
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
        display: ['Cairo', 'serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
