import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub project page: https://<org>.github.io/<repo>/
const GH_PAGES_BASE = '/op-flex/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? GH_PAGES_BASE : '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind to 0.0.0.0 so phones on the same Wi-Fi can hit it
  },
}));
