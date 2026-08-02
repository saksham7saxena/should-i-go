/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cal: {
          primary: '#111111',
          'primary-active': '#242424',
          body: '#374151',
          muted: '#6b7280',
          hairline: '#e5e7eb',
          'hairline-soft': '#f3f4f6',
          canvas: '#ffffff',
          'surface-soft': '#f8f9fa',
          'surface-card': '#f5f5f5',
          'surface-dark': '#101010',
        },
        decision: {
          go: '#10b981',
          maybe: '#f59e0b',
          skip: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'cal-card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'cal-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
