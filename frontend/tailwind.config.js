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
        'sans': ['Inter', 'Noto Sans', 'sans-serif'],
      },
      colors: {
        primary: '#137fec',
        'brand-blue': '#3A86FF',
        'medium-gray': '#6B7280',
        'dark-gray': '#111827',
        'pale-blue': '#F0F5FF',
      },
    },
  },
  plugins: [],
}
