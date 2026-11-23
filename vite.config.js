import { cpSync } from 'node:fs';
import { defineConfig } from 'vite';

for (const dir of ['cmaps', 'standard_fonts', 'wasm']) {
  cpSync(`node_modules/pdfjs-dist/${dir}`, `public/pdfjs/${dir}`, { recursive: true });
}

export default defineConfig({
  base: './',
  server: { open: '/?pdf=/test/tracemonkey.pdf' },
  build: { license: { fileName: 'LICENSES.md' } },
});
