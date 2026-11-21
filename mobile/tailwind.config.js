/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A1628',
          mid: '#0D2137',
          light: '#1B3A5C',
        },
        cyan: {
          DEFAULT: '#00B4D8',
          light: '#90E0EF',
          pale: '#E0F7FC',
        },
        surface: '#FAFAFA',
        'color-border': '#E8F4F8',
        'text-primary': '#0A1628',
        'text-secondary': '#4A6080',
        'text-muted': '#8BA3B8',
      },
    },
  },
  plugins: [],
};
