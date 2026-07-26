/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hit: {
          gold: '#e6b84c',
          'gold-hi': '#f3cd6e',
          cream: '#f3f0e7',
          'cream-2': '#e6e2d6',
          blue: '#0b2557',
          'blue-700': '#123f8f',
          'blue-400': '#3d78dd',
          ink: '#0d2c66',
          muted: '#5a6b8c',
          yellow: '#e6b84c',
          'yellow-dark': '#c9a23e',
          navy: '#081d45',
          'navy-dark': '#050f26',
          dark: '#0b2557',
        },
      },
      fontFamily: {
        heading: ['Unbounded', 'sans-serif'],
        body: ['Golos Text', 'sans-serif'],
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '26px',
      },
    },
  },
  plugins: [],
};
