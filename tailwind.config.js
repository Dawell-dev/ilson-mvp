/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ['calc(0.75rem * var(--font-scale, 1))', { lineHeight: '1.4' }],
        sm: ['calc(0.875rem * var(--font-scale, 1))', { lineHeight: '1.45' }],
        base: ['calc(1rem * var(--font-scale, 1))', { lineHeight: '1.5' }],
        lg: ['calc(1.125rem * var(--font-scale, 1))', { lineHeight: '1.5' }],
        xl: ['calc(1.25rem * var(--font-scale, 1))', { lineHeight: '1.4' }],
        '2xl': ['calc(1.5rem * var(--font-scale, 1))', { lineHeight: '1.35' }],
        '3xl': ['calc(1.875rem * var(--font-scale, 1))', { lineHeight: '1.25' }],
        '4xl': ['calc(2.25rem * var(--font-scale, 1))', { lineHeight: '1.15' }],
      },
      colors: {
        primary: {
          DEFAULT: '#E65100',
          light: '#F4511E',
          bg: '#FBE9E7',
          soft: '#FFF3E0',
        },
        kakao: {
          DEFAULT: '#FEE500',
          dark: '#191919',
        },
        accent: '#C62828',
        pay: '#E65100',
      },
      maxWidth: {
        app: '430px',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease',
        'fade-in': 'fadeIn 0.3s ease',
      },
    },
  },
  plugins: [],
}
