/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#FDE8EF',
          100: '#FBCFDF',
          200: '#F7A0BF',
          300: '#E06695',
          400: '#D94D7E',
          500: '#CC3366',
          600: '#B32D5A',
          700: '#99264D',
          800: '#801F40',
          900: '#661933',
        },
      },
    },
  },
  plugins: [],
};
