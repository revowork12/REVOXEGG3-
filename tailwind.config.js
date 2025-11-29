/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#001F3F',
          50: '#E6F0FF',
          100: '#CCE1FF',
          500: '#001F3F',
          600: '#001835',
          700: '#00122B',
        },
        cream: {
          DEFAULT: '#F5F2E8',
          50: '#FEFDFB',
          100: '#F5F2E8',
          200: '#EDE8D8',
        },
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}