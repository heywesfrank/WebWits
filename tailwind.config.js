/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-outfit)'],
      },
      colors: {
        // THE MAGIC SWITCH:
        // This overrides 'yellow' so your existing classes (bg-yellow-400)
        // render as these Blue colors instead.
        yellow: {
          50: '#f0f9ff',  // Lightest blue (was yellow-50)
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Close to your logo (#00aeef)
          600: '#0284c7', // A nice darker blue for buttons/text
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // If you ever need your actual logo color specifically:
        brand: {
          DEFAULT: '#00aeef',
          dark: '#0077a3', // Darker version of your logo
        }
      },
    },
  },
  plugins: [],
};
