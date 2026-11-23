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

`dist/` is a self-contained static folder; copy it to any web server. `npm run preview` serves the build locally.

## CI and releases

`.github/workflows/ci.yml` runs the tests and the build on every push to `main` and on pull requests.

Releases are created by hand (GitHub web UI or `gh release create v0.1.0 --generate-notes`), with the tag matching `version` in `package.json`. Publishing a release triggers CI, which attaches `pdf-flipbook-reader.zip` (the built `dist/`) to it.

## Install via Composer (Drupal)

In the site's `composer.json`, with `drupal-library` mapped to `web/libraries/{$name}` in `installer-paths`:

```json
"repositories": [
  {
    "type": "package",
    "package": {
      "name": "ondra2305/pdf-flipbook-reader",
      "version": "0.1.0",
      "type": "drupal-library",
      "dist": {
        "url": "https://github.com/ondra2305/pdf-flipbook-reader/releases/download/v0.1.0/pdf-flipbook-reader.zip",
        "type": "zip"
      }
    }
  }
]
```

Then `composer require ondra2305/pdf-flipbook-reader:0.1.0`. For a new release, bump the version in both places.

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
