/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        decision: {
          go: '#10b981',      // Emerald 500
          maybe: '#f59e0b',   // Amber 500
          skip: '#ef4444',    // Red 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow-go': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-maybe': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-skip': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}
