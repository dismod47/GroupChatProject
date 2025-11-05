/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        uh: {
          DEFAULT: '#C8102E',
          hover: '#A00D26',
          active: '#8B0B20',
        },
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-slide-in': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-slide-out': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 180ms ease-out',
        'toast-slide-in': 'toast-slide-in 200ms ease-out',
        'toast-slide-out': 'toast-slide-out 200ms ease-in',
      },
      transitionDuration: {
        '150': '150ms',
        '180': '180ms',
      },
    },
  },
  plugins: [],
}
