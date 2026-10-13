/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17110e',
        coal: '#231a15',
        cream: '#fff7ea',
        mustard: '#ffc22b',
        tomato: '#e4361b',
        crust: '#c9781e',
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(.6)' }, '60%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
        up: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        slide: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: { pop: 'pop .35s ease-out', up: 'up .35s ease-out both', slide: 'slide .3s ease-out', marquee: 'marquee 30s linear infinite' },
    },
  },
  plugins: [],
};
