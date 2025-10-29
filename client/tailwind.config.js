/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#5B4BFF',
        'primary-gradient-start': '#6B2FFF',
        'primary-gradient-end': '#2B3DFF',
        'accent': '#8E7CFF',
        'dark-text': '#333333',
        'background': '#FFFFFF',
        'secondary-background': '#F5F6FA',
        'shadow-depth': '#E0E3F5',
        'muted-gray': '#9CA3AF',
      },
    },
  },
  plugins: [],
}
