/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0A0A0A',
          darkGray: '#121212',
          cardGray: 'rgba(20, 20, 20, 0.6)',
          pureWhite: '#FFFFFF',
          accentNeon: '#CCFF00', // Premium high-attitude highlight accent
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Archivo', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        premium: '20px'
      },
      boxShadow: {
        'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}