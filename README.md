# PDF Flipbook Reader

Page-flip PDF reader (PDF.js + StPageFlip) built as a static page, opened directly or embedded via iframe.

Demo: https://ondra2305.github.io/pdf-flipbook-reader/

## Install

Every [release](https://github.com/ondra2305/pdf-flipbook-reader/releases) has `pdf-flipbook-reader.zip`, the built reader as a self-contained static folder.

### Composer (Drupal)

With `drupal-library` mapped to `web/libraries/{$name}` in the site's `installer-paths`, add to `composer.json`:

```json
"repositories": [
  {
    "type": "package",
    "package": {
      "name": "ondra2305/pdf-flipbook-reader",
      "version": "1.0.0",
      "type": "drupal-library",
      "dist": {
        "url": "https://github.com/ondra2305/pdf-flipbook-reader/releases/download/v1.0.0/pdf-flipbook-reader.zip",
        "type": "zip"
      }
    }
  }
]
```

Then run `composer require ondra2305/pdf-flipbook-reader:1.0.0`. The reader ends up in `web/libraries/pdf-flipbook-reader/`. To update, change the version in all three places and run `composer update ondra2305/pdf-flipbook-reader`.

### Manual

Unzip `pdf-flipbook-reader.zip` into any folder on the web server that also serves the PDFs, e.g. `libraries/pdf-flipbook-reader/`.

## Use

Open the reader directly or embed it:

```html
<iframe src="/libraries/pdf-flipbook-reader/index.html?pdf=/system/files/issue.pdf"
        width="100%" height="800" allowfullscreen></iframe>
```

| Parameter | Default | |
|---|---|---|
| `pdf` | required | PDF URL; must be on the same site as the reader |
| `mode` | `book` | `book`: stiff cover and last page; `magazine`: every page curls |
| `lang` | `cs` | `en` |
| `dl` | `1` | `0` hides the download button |
| `tl` | `1` | `0` disables the selectable text layer |
| `filename` | from `pdf` URL | download name; page title when the PDF has no title in its metadata |
| `prefetch` | `0` | `1` downloads the whole PDF in the background |

The PDF is loaded with the visitor's cookies, so the server's access rules (e.g. Drupal private files) apply; a refused request shows "no access".

Colors and radius: override the `--kf-*` variables in `src/reader.css`.

## Server requirements

- `.mjs` served as `text/javascript`, `.wasm` as `application/wasm`. The included `.htaccess` does this on Apache; nginx needs it in its config.
- PDFs served with HTTP Range support (`Accept-Ranges: bytes`, check with `curl -I <pdf url>`), otherwise the whole file is downloaded before the first page shows.
- `.js`, `.mjs` and `.css` compressed (gzip or brotli); the first visit then loads about 520 KB of code.
- `assets/` cached long-term (`Cache-Control: public, max-age=31536000, immutable`); the file names contain a content hash.

## Development

```sh
npm install
npm run dev                          # opens test/tracemonkey.pdf; other PDFs: put into public/, open ?pdf=file.pdf
npx playwright install chromium
npm test                             # Playwright tests in test/
npm run build                        # dist/, preview with npm run preview
```

## License

MIT, see [LICENSE](LICENSE). Third-party code: [NOTICE](NOTICE).
