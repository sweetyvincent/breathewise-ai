/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const staticBuild = process.env.VITE_STATIC_MODE === 'true';

/** Production-only Content-Security-Policy (a meta tag, since static hosts like GitHub Pages cannot set headers). */
function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml() {
      const origins = [process.env.VITE_API_URL, process.env.VITE_SUPABASE_URL].filter(Boolean).map((u) => new URL(u as string).origin);
      const connect = ["'self'", ...origins, ...origins.filter((o) => o.includes('supabase')).map((o) => o.replace('https', 'wss'))].join(
        ' ',
      );
      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self' data:",
        `connect-src ${connect}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }];
    },
  };
}

export default defineConfig({
  plugins: [react(), cspPlugin()],
  // Relative base lets the static build work under any GitHub Pages path (user.github.io/<repo>/).
  base: staticBuild ? './' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The static build reuses the server's pure TypeScript logic (schemas, rules, simulator, impact maths).
      '@server': fileURLToPath(new URL('../server/src', import.meta.url)),
      // server/src files import zod; resolve it from the client's install so the build works without installing the server.
      zod: fileURLToPath(new URL('./node_modules/zod', import.meta.url)),
      'node:crypto': fileURLToPath(new URL('./src/static/cryptoShim.ts', import.meta.url)),
    },
  },
  define: { 'process.env.LOG_LEVEL': JSON.stringify('warn') },
  server: {
    port: 5173,
    // In development the API runs on :8787; in production set VITE_API_URL instead.
    proxy: { '/api': { target: 'http://localhost:8787', changeOrigin: true } },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'lcov'],
      thresholds: { lines: 88, statements: 88, functions: 64, branches: 74 },
    },
  },
});
