import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';
  const plugins = [react(), tailwindcss()];

  // The signaling plugin is a development-server middleware, not a GitHub Pages backend.
  // Load it only for local development so Pages builds don't require server code.
  if (!isGitHubPages) {
    const { signalingPlugin } = await import('./src/server/signalingPlugin.ts');
    plugins.push(signalingPlugin());
  }

  return {
    base: isGitHubPages ? '/Winner/' : '/',
    plugins,
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, '.') },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
