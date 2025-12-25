/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/index.html",
    "./public/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Design System - 60/30/10 Rule
        dominant: {
          DEFAULT: '#F8F9FA', // 60% - Dominant color
          50: '#FFFFFF',
          100: '#F8F9FA',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
        },
        secondary: {
          DEFAULT: '#2C3E50', // 30% - Secondary color
          50: '#ECF0F1',
          100: '#D5DBDB',
          200: '#AAB7B8',
          300: '#85929E',
          400: '#5D6D7E',
          500: '#2C3E50',
          600: '#273746',
          700: '#212F3C',
          800: '#1C2833',
          900: '#17202A',
        },
        accent: {
          DEFAULT: '#3B82F6', // 10% - Accent color (Blue)
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Legacy color support (for gradual migration)
        orange: {
          500: '#3B82F6', // Map to new accent
        },
        purple: {
          400: '#2C3E50', // Map to new secondary
        },
      },
      fontFamily: {
        sans: ['Work Sans', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'], // Body text
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'], // Headings
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        progress: 'progress 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}