import { defineConfig } from 'vite';
import { resolve } from 'node:path';


export default defineConfig({
  build: {
    // single self-contained ES module, no external deps
    lib: {
      entry: resolve( __dirname, 'src/eleksmaker-gif-editor.ts' ),
      name: 'EleksmakerGifEditor',
      fileName: () => 'eleksmaker-gif-editor.js',
      formats: [ 'es' ],
    },
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
    minify: 'esbuild',
    target: 'es2022',
  },
});
