/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F3F5F7',
        surface: '#FFFFFF',
        ink: '#17212B',
        slate: '#627080',
        line: '#DDE2E7',
        brand: '#315EFB',
        positive: '#0F766E',
        attention: '#B45309',
        risk: '#B42318',
      },
    },
  },
  plugins: [],
};
