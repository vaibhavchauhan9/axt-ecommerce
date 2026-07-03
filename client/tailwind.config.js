// client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#000000',
          'neutral-dark': '#0a000a',
          accentNeon: '#dfff00',
          'gray-border': 'rgba(255,255,255,0.05)',
          'card-gray': '#111111',
          'pure-white': '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Rubik', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      boxShadow: {
        'glass-card': '0 10px 40px rgba(0, 0, 0, 0.25)',
        'glass-inset': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backdropBlur: {
        premium: '24px',
      },
    },
  },
  plugins: [],
}