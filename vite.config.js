import { cpSync, rmSync } from 'node:fs';
import { defineConfig } from 'vite';

rmSync('public/pdfjs', { recursive: true, force: true });
for (const dir of ['cmaps', 'iccs', 'standard_fonts', 'wasm']) {
  cpSync(`node_modules/pdfjs-dist/${dir}`, `public/pdfjs/${dir}`, {
    recursive: true,
    filter: (src) => !src.includes('quickjs'),
  });
}

export default defineConfig({
  base: './',
  server: { open: '/?pdf=/test/tracemonkey.pdf' },
  build: { license: { fileName: 'LICENSES.md' } },
});
