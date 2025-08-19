import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import fs from 'vite-plugin-fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isDebug = process.env.NODE_ENV === 'development' || mode === 'development';

    return {
      root: resolve(__dirname, 'src'),
      plugins: [fs()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/main/fastify.ts'),
          name: 'Backend',
          formats: ['es'],
          fileName: 'backend-bundle',
        },
        target: 'es2022',
        outDir: resolve(__dirname, 'dist'),
        rollupOptions: {
          external: [
            'path', 'url', 'fs',
            ...Object.keys(require('./package.json').dependencies || {})
          ],
        },
        emptyOutDir: true,
        minify: !isDebug,
      },
    }
  });