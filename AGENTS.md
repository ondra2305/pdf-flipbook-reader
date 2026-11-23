# Agent rules

- Never commit, stage or rewrite git history. The user commits.
- Smallest change that solves the task. No new dependencies, frameworks or abstractions without asking.
- No comments unless the reason cannot be expressed in code (e.g. a library quirk).
- Third-party code comes from npm only; never copy library files into the repo.
- Keep the reader a static page usable in an iframe; URL parameters are the public API, document changes in `README.md`.
- Tasks live in `TODO.md` (local only, excluded via `.git/info/exclude`). Work on one task, mark it done there, report what was not verified.

## Layout

- `index.html` markup; toolbar labels come from `data-title`/`data-text` keys in `src/i18n.js`
- `src/main.js` reads URL parameters, loads the PDF, wires the modules
- `src/book.js` page elements and StPageFlip
- `src/renderer.js` render queue, canvases and text layer
- `src/viewport.js` fit to stage, zoom, pan, fullscreen
- `src/toolbar.js` icons, labels, buttons and keyboard shortcuts
- `src/download.js` download of the loaded PDF
- `src/reader.css` styles, `src/textlayer.css` PDF.js text layer styles
- `test/reader.spec.js` Playwright tests, `test/tracemonkey.pdf` sample PDF (from PDF.js)
- `vite.config.js` copies PDF.js cmaps, fonts and wasm from `node_modules` to `public/pdfjs/` (generated, ignored)

## Check

- `npm run build` and `npm test` must pass. New behavior gets a test in `test/reader.spec.js`.
- `window.__POC_READY__` is set once the first spread is rendered; tests wait for it.
- The workspace is the user's live checkout: do not reinstall or delete its `node_modules`; install and run tests in a copy outside it.
