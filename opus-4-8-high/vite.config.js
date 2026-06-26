import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Minimal Vite config: React plugin only, no extra dependencies.
export default defineConfig({
  plugins: [react()],
});
