import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

import aliases from './vite.aliases.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: aliases,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '*.config.js',
      ],
    },
  },
});
