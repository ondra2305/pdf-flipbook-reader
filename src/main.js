import { getDocument, GlobalWorkerOptions, InvalidPDFException, ResponseException } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './textlayer.css';
import './reader.css';
import { translator } from './i18n.js';
import { renderToolbar, bindToolbar } from './toolbar.js';
import { createBook } from './book.js';
import { createRenderer } from './renderer.js';
import { createViewport } from './viewport.js';
import { downloadPdf } from './download.js';

GlobalWorkerOptions.workerSrc = workerUrl;

const params = new URLSearchParams(location.search);
const pdfParam = params.get('pdf');
const lang = params.get('lang') === 'en' ? 'en' : 'cs';
const t = translator(lang);
const statusEl = document.getElementById('status');
const errorEl = document.getElementById('error');
const pageLabel = document.getElementById('pageLabel');

function fail(message) {
  statusEl.classList.add('hidden');
  errorEl.textContent = t('error') + message;
  console.error(message);
}

const assetUrl = (path) => new URL(path, location.href).href;

function baseName(url) {
  const name = url.split('?')[0].split('/').pop();
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

async function open() {
  if (new URL(pdfParam, location.href).origin !== location.origin) throw new Error(t('badOrigin'));
  const fileName = params.get('filename') || baseName(pdfParam) || 'document.pdf';
  document.title = fileName;
  statusEl.textContent = t('loading');

  const onDemand = params.get('prefetch') !== '1';
  const pdf = await getDocument({
    url: pdfParam,
    rangeChunkSize: 256 * 1024,
    wasmUrl: assetUrl('pdfjs/wasm/'),
    iccUrl: assetUrl('pdfjs/iccs/'),
    cMapUrl: assetUrl('pdfjs/cmaps/'),
    cMapPacked: true,
    standardFontDataUrl: assetUrl('pdfjs/standard_fonts/'),
    disableAutoFetch: onDemand,
    disableStream: onDemand,
  }).promise;
  pdf.getMetadata().then(({ info, metadata }) => {
    // Ghostscript writes "Untitled" when the source has no title
    const title = [metadata?.get('dc:title'), info?.Title].map((s) => s?.trim()).find((s) => s && s !== 'Untitled');
    if (title) document.title = title;
  }).catch(() => {});
  const first = (await pdf.getPage(1)).getViewport({ scale: 1 });

  const book = createBook(document.getElementById('book'), {
    pageCount: pdf.numPages,
    pageWidth: first.width,
    pageHeight: first.height,
    magazine: params.get('mode') === 'magazine',
    onTurn: updatePage,
    onFlipping: (flipping) => {
      renderer.setPaused(flipping);
      updatePage();
    },
  });
  statusEl.textContent = '';
  statusEl.classList.add('hidden');

  const renderer = createRenderer({
    pdf,
    canvases: book.canvases,
    aspect: book.aspect,
    textLayer: params.get('tl') !== '0',
    onError: (n, err) => fail(t('renderPage', n, err)),
  });

  function updatePage() {
    const index = book.current();
    pageLabel.textContent = `${index + 1} / ${pdf.numPages}`;
    renderer.ensureAround(index);
  }

  const view = createViewport({
    aspect: book.aspect,
    single: pdf.numPages === 1,
    next: book.next,
    prev: book.prev,
    onFit: (width, displayWidth) => renderer.resize(width, displayWidth) && updatePage(),
    onResize: book.update,
  });
  view.fit();

  bindToolbar({
    prev: book.prev,
    next: book.next,
    zoomIn: view.zoomIn,
    zoomOut: view.zoomOut,
    zoomFit: view.zoomReset,
    fs: view.toggleFullscreen,
    download: () => downloadPdf(pdf, fileName)
      .catch((err) => fail(t('downloadFail', err.message))),
    lang: () => {
      params.set('lang', lang === 'cs' ? 'en' : 'cs');
      location.search = params.toString();
    },
  });
  if (params.get('dl') === '0') document.getElementById('download').style.display = 'none';
  if (!document.fullscreenEnabled) document.getElementById('fs').style.display = 'none';

  await renderer.render(1);
  if (pdf.numPages > 1) await renderer.render(2);
  view.fit();
  updatePage();
  window.__POC_READY__ = { numPages: pdf.numPages, pageIndex: book.current() };
  window.__POC_RENDERED__ = renderer.renderedCount;
}

document.documentElement.lang = lang;
renderToolbar(t);
document.documentElement.classList.add('ready');
function describe(err) {
  if (err instanceof InvalidPDFException) return t('notPdf');
  if (err instanceof ResponseException) {
    if (err.missing) return t('notFound');
    return err.status === 401 || err.status === 403 ? t('noAccess') : t('serverError', err.status);
  }
  return err.message || String(err);
}

if (pdfParam) open().catch((err) => fail(describe(err)));
else fail(t('noPdf'));
