/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#17102B',
        'sidebar-2': '#211741',
        primary: '#7C4DFF',
        'primary-2': '#9B5CFF',
        'bg': '#F6F5FA',
        card: '#FFFFFF',
        text: '#1E1B2E',
        muted: '#6E6A7C',
        border: '#ECEAF2',
        green: '#22C58B',
        pink: '#F45B9C',
        amber: '#F5A623',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(30,27,46,.04), 0 8px 24px rgba(30,27,46,.06)',
        lg: '0 12px 40px rgba(124,77,255,.18)',
      },
      borderRadius: {
        DEFAULT: '16px',
      },
    },
  },
  plugins: [],
}
