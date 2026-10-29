import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single-file build: dist/index.html contains all JS and CSS, so the prototype
// can be opened directly, hosted anywhere static, or shared as one link.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
