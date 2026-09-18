import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Shared SPFx sources must use the standalone harness configuration.
  tsconfig: './tsconfig.json',
  optimizeDeps: {
    rolldownOptions: {
      tsconfig: './tsconfig.json'
    }
  },
  plugins: [react()]
});
