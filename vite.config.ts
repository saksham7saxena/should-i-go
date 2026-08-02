import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(process.env.VITE_COMMIT_SHA || '2134f94'),
  },
  server: {
    port: 3000,
    open: false,
  },
});
