import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const isDebug = process.env.NODE_ENV === 'development' || mode === 'development';

    return {
      root: resolve(__dirname, 'src'),
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
            'path', 'url',
            ...Object.keys(require('./package.json').dependencies || {})
          ],
        },
        emptyOutDir: true,
        minify: !isDebug,
      },
    }
  });