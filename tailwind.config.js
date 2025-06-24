/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-red-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-blue-500',
    'text-red-500',
    'text-green-500',
    'text-yellow-500',
    'text-blue-500',
    'border-red-500',
    'border-green-500',
    'border-yellow-500',
    'border-blue-500',
    'hover:bg-red-600',
    'hover:bg-green-600',
    'hover:bg-yellow-600',
    'hover:bg-blue-600',
    'focus:ring-red-500',
    'focus:ring-green-500',
    'focus:ring-yellow-500',
    'focus:ring-blue-500',
  ],
  theme: {
    extend: {
      maxWidth: {
        '7xl': '80rem',
      },
      colors: {
        primary: '#ff9800',
        'dark-text': '#333333',
        text: '#2d2d2d',
        accent: '#ffbd97',
        background: '#fff5ed',
        'light-accent': '#fff0e6',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}