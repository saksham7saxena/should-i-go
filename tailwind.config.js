/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eleven: {
          canvas: '#f5f5f5',
          'canvas-soft': '#fafafa',
          ink: '#0c0a09',
          primary: '#292524',
          'primary-active': '#0c0a09',
          body: '#4e4e4e',
          'body-strong': '#292524',
          muted: '#777169',
          'muted-soft': '#a8a29e',
          hairline: '#e7e5e4',
          'hairline-strong': '#d6d3d1',
          card: '#ffffff',
        },
        orb: {
          mint: '#a7e5d3',
          peach: '#f4c5a8',
          lavender: '#c8b8e0',
          sky: '#a8c8e8',
          rose: '#e8b8c4',
        },
        decision: {
          go: '#16a34a',
          maybe: '#d97706',
          skip: '#dc2626',
        }
      },
      fontFamily: {
        serif: ['Waldenburg', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'eleven-card': '0 4px 16px 0 rgba(0, 0, 0, 0.04)',
        'eleven-soft': '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
