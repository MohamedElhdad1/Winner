
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const isGitHubPages = process.env.GITHUB_PAGES === 'true';

  const plugins = [react(), tailwindcss()];

  if (!isGitHubPages) {
    const { signalingPlugin } = await import('./src/server/signalingPlugin.ts');
    plugins.push(signalingPlugin());
  }

  return {
    base: isGitHubPages ? '/Winner/' : '/',
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
