import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001, // Use a different port
    open: true  // Automatically open browser
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  }
});