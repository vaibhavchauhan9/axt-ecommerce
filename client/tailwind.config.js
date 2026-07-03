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
          neutralDark: '#0a000a',
          accentNeon: '#dfff00', // Neon Brutalist Yellow/Green
          grayBorder: 'rgba(255,255,255,0.05)',
        }
      },
      // 🟢 OVERRIDING CORE SANS TOKEN LAYER WITH RUBIK
      fontFamily: {
        sans: ['Rubik', 'sans-serif'],
      },
    },
  },
  plugins: [],
}