/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hit: {
          yellow: '#FFE500',
          'yellow-dark': '#D4BF00',
          blue: '#4A6FA5',
          'blue-light': '#7B9FCC',
          'blue-dark': '#2C4A7C',
          navy: '#1E3A5F',
          'navy-dark': '#152C4A',
          dark: '#0a0e1a',
        },
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
