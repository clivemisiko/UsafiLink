/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UsafiLink Theme Colors
        ink: '#1a1a18',
        parchment: '#f5f0e8',
        sage: '#4a7c59',
        'sage-light': '#6a9e79',
        'sage-muted': '#d4e6da',
        sand: '#e8d5b0',
        cream: '#faf7f2',
        rust: '#c4622d',
        stone: '#8a8475',
        
        // Primary & Secondary (maintaining compatibility)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundColor: {
        base: 'var(--parchment)',
        'base-alt': 'var(--cream)',
      },
      textColor: {
        base: 'var(--ink)',
        muted: 'var(--stone)',
        accent: 'var(--sage)',
      },
      borderColor: {
        base: 'rgba(26,26,24,0.08)',
        muted: 'rgba(26,26,24,0.05)',
      }
    },
  },
  plugins: [],
};