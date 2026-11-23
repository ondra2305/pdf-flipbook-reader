# PDF Flipbook Reader

Page-flip PDF reader (PDF.js + StPageFlip) built as a static page and embedded via iframe.

## Development

```sh
npm install
npm run dev
```

Opens `test/tracemonkey.pdf` (the PDF.js sample paper). Other PDFs: put them into `public/` and open `http://localhost:5173/?pdf=file.pdf`.

## Test

```sh
npx playwright install chromium
npm test
```

Playwright starts the dev server itself and runs `test/reader.spec.js` against `test/tracemonkey.pdf`.

## Build

```sh
npm run build
```

Copy `dist/` to the site, e.g. `web/libraries/pdf-flipbook-reader/`. `npm run preview` serves the build locally.

## Embed

```html
<iframe src="/libraries/pdf-flipbook-reader/index.html?pdf=/system/files/issue.pdf"
        width="100%" height="800" allowfullscreen></iframe>
```

| Parameter | Default | |
|---|---|---|
| `pdf` | required | PDF URL, must be same origin as the reader |
| `mode` | `magazine` | any other value keeps hard covers |
| `lang` | `cs` | `en` |
| `dl` | `1` | `0` hides the download button |
| `tl` | `1` | `0` disables the text layer |
| `prefetch` | `0` | `1` downloads the whole PDF in the background |

Colors and radius: override the `--kf-*` variables in `src/reader.css`.

## Server requirements

- `.mjs` served as `text/javascript`, `.wasm` as `application/wasm` (`.htaccess` covers Apache; nginx ignores it).
- PDFs served with HTTP Range support, otherwise the whole file is downloaded before the first page shows.

## License

MIT, see [LICENSE](LICENSE). Third-party code: [NOTICE](NOTICE).
