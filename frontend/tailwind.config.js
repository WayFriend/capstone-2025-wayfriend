/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: '#137fec',
      },
    },
  },
  plugins: [],
}
