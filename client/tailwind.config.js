/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        drift1: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(60px, 40px)' },
        },
        drift2: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-50px, -30px)' },
        },
        scrollDown: {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '50%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '51%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        drift1: 'drift1 12s ease-in-out infinite',
        drift2: 'drift2 15s ease-in-out infinite',
        scrollDown: 'scrollDown 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
