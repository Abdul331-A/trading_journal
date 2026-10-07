/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#eef3ff', 100: '#e0e9ff', 500: '#4066e0', 600: '#3354d1', 700: '#2a44ad' },
        ink: { 900: '#0f1222', 700: '#2c3150', 500: '#5b6280', 400: '#8089a6', 200: '#e3e6f0', 100: '#eef0f7', 50: '#f8f9fd' },
        profit: '#3fa877',
        loss: '#d9534f',
      },
      boxShadow: { card: '0 1px 2px rgba(20,24,60,.04), 0 4px 16px rgba(20,24,60,.05)' },
    },
  },
  plugins: [],
};
