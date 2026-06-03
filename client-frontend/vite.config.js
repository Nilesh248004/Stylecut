import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  envDir: '.',
  define: {
    'import.meta.env.VITE_APP_ROLE': JSON.stringify(process.env.VITE_APP_ROLE || 'client'),
    'import.meta.env.VITE_DEFAULT_PAGE': JSON.stringify(process.env.VITE_DEFAULT_PAGE || 'client-auth')
  },
  resolve: {
    alias: {
      'lucide-react': resolve(currentDir, 'node_modules/lucide-react'),
      react: resolve(currentDir, 'node_modules/react'),
      'react-dom': resolve(currentDir, 'node_modules/react-dom')
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
