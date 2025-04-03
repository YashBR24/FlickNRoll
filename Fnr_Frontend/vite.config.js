import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}, // Optional: Mock process.env for compatibility (not needed for VITE_ variables)
  },
});