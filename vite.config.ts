import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// If deploying to GitHub Pages WITHOUT a custom domain, change base to '/your-repo-name/'
// With a custom domain (or for local dev), './' works universally.
export default defineConfig({
  plugins: [svelte()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
