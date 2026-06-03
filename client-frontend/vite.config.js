import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  envDir: '.',
  define: {
    'import.meta.env.VITE_DEFAULT_PAGE': JSON.stringify(process.env.VITE_DEFAULT_PAGE || 'client-auth')
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
