import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import aliases from './vite.aliases.js';

// Load all env variables (including non-VITE_ prefixed) for proxy config
const env = loadEnv('development', process.cwd(), '');

// HTTPS configuration (optional)
// Set VITE_HTTPS=false to disable HTTPS in development
const useHttps = process.env.VITE_HTTPS !== 'false';
const httpsPath = path.join(os.homedir(), 'https');
const keyPath = path.join(httpsPath, 'key.pem');
const certPath = path.join(httpsPath, 'cert.pem');

let httpsConfig = false;

if (useHttps && fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  try {
    const key = fs.readFileSync(keyPath);
    const cert = fs.readFileSync(certPath);
    httpsConfig = { key, cert };
    console.log('✅ HTTPS enabled for development');
  } catch (error) {
    console.warn('⚠️  HTTPS certificates found but could not be read:', error.message);
    console.warn('   Falling back to HTTP');
  }
} else if (useHttps) {
  console.warn('⚠️  HTTPS certificates not found in ~/https/');
  console.warn('   Expected: key.pem and cert.pem');
  console.warn('   Falling back to HTTP');
  console.warn('   Set VITE_HTTPS=false to disable this warning');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: aliases,
  },
  server: {
    https: httpsConfig,
    host: true,
    port: 3000,
    proxy: {
      '/api/latest': {
        target: env.FREEBOX_API_TARGET,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            if (req.url.includes('/tv/img/')) {
              proxyRes.headers['cache-control'] = 'public, max-age=604800, immutable';
            }
          });
        },
      },
    },
  },
  build: {
    // Generate source maps for production debugging
    sourcemap: true,
    // Reduce bundle size by removing console.log in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
