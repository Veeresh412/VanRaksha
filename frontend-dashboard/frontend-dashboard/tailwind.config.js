/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F8F4',
        forest: '#063C2A',
        forestLight: '#0B5D3F',
        accentGreen: '#2E9B5F',
        borderTone: '#DDE4DD',
        textMain: '#15221C',
        textSecondary: '#66736C',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(12, 36, 24, 0.08)',
        panel: '0 8px 24px rgba(7, 49, 32, 0.08)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
}
