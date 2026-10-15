/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hestim: {
          blue: '#1D4ED8',
          dark: '#1E293B',
        }
      }
    },
  },
  plugins: [],
}
