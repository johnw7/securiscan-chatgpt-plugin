/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        sand: { 50: '#faf8f5', 100: '#f3efe8', 200: '#e8dfd1', 300: '#d8c7ad', 600: '#8a7558' },
        mist: { 50: '#f7f7f5', 100: '#f3f2ef', 200: '#ecebe7', 300: '#d8d6d0', 500: '#6b6b6b' },
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: { 'fade-up': 'fadeUp .35s ease-out both' },
    },
  },
  plugins: [],
};
