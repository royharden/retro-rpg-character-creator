/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // NES-style palette
        navy: {
          900: '#0a0e27',
          800: '#131637',
          700: '#1a1f4a',
          600: '#252b5c',
          500: '#353d7a',
        },
        cream: {
          400: '#f4e8c1',
          500: '#fef3c7',
          600: '#e8d99b',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        crimson: {
          400: '#dc2626',
          500: '#b91c1c',
          600: '#991b1b',
        },
        teal: {
          400: '#14b8a6',
          500: '#0d9488',
          600: '#0f766e',
        },
        grass: {
          400: '#22c55e',
          500: '#16a34a',
          600: '#15803d',
        },
        slate: {
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        terminal: ['"VT323"', 'monospace'],
      },
      animation: {
        blink: 'blink 1s steps(2) infinite',
        'scanline-flicker': 'scanline-flicker 0.15s infinite',
        'press-start': 'press-start 0.6s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.4s ease-out',
        'dice-roll': 'dice-roll 0.5s ease-in-out',
        'pip': 'pip 0.2s ease-out',
        'shake': 'shake 0.3s ease-in-out',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'scanline-flicker': {
          '0%': { opacity: '0.97' },
          '50%': { opacity: '0.99' },
          '100%': { opacity: '0.97' },
        },
        'press-start': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'dice-roll': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'pip': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
