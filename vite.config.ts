import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Bind to IPv4 explicitly: on some Windows setups "localhost" resolves to ::1 only
  // and the browser cannot reach the dev server.
  server: {
    host: '127.0.0.1',
    port: 5173,
    open: true,
  },
  preview: {
    host: '127.0.0.1',
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Stable dates in tests that touch "today".
    env: { TZ: 'Europe/Minsk' },
  },
});
