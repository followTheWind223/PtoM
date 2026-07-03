/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#f5f6f8',
          hover: '#e8eaed',
          active: '#d3e3fd',
          border: '#e0e0e0',
        },
        editor: {
          bg: '#ffffff',
          text: '#1a1a1a',
        },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
