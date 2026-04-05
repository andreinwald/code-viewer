import { defineConfig, Plugin } from 'vite';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';

function mdTextPlugin(): Plugin {
  return {
    name: 'md-text',
    transform(code, id) {
      if (id.endsWith('.md')) {
        return { code: `export default ${JSON.stringify(code)};`, map: null };
      }
    },
  };
}

export default defineConfig({
  root: 'src/electron',
  plugins: [
    electron({
      main: {
        entry: path.resolve(__dirname, 'src/electron/main.ts'),
        vite: {
          plugins: [mdTextPlugin()],
          build: {
            outDir: path.resolve(__dirname, 'dist/electron'),
            rollupOptions: {
              external: ['@anthropic-ai/claude-agent-sdk'],
              output: { dynamicImportInCjs: false },
            },
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'src/electron/preload.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist/electron'),
          },
        },
      },
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist/electron'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
