/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-bg': '#001427',
        'custom-text': '#ffffff',
        'custom-elements':'#d90429'
      },
    },
  },
  plugins: [],
}