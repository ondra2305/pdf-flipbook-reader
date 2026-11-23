import { TextLayer } from 'pdfjs-dist';

const LOOKAHEAD = 5;
const CONCURRENCY = 2;

export function createRenderer({ pdf, canvases, textLayer, onError }) {
  const done = new Set();
  const queue = [];
  const queued = new Set();
  const inFlight = new Map();
  let active = 0;
  let paused = false;
  let targetW = 800;
  let displayPageW = 400;

  function enqueue(n, urgent) {
    if (done.has(n) || queued.has(n) || inFlight.has(n)) return;
    queued.add(n);
    if (urgent) queue.unshift(n);
    else queue.push(n);
    pump();
  }

  function pump() {
    while (!paused && active < CONCURRENCY && queue.length) {
      const n = queue.shift();
      active++;
      render(n).finally(() => {
        active--;
        queued.delete(n);
        pump();
      });
    }
  }

  function render(n) {
    if (inFlight.has(n)) return inFlight.get(n);
    const promise = draw(n)
      .catch((err) => onError(n, err))
      .finally(() => inFlight.delete(n));
    inFlight.set(n, promise);
    return promise;
  }

  async function draw(n) {
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const canvas = canvases[n - 1];
    if (canvas.width !== targetW) {
      canvas.width = targetW;
      canvas.height = Math.round((targetW * base.height) / base.width);
    }
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: targetW / base.width }) }).promise;
    done.add(n);
    if (textLayer) await drawText(page, canvas.parentElement, displayPageW / base.width);
  }

  async function drawText(page, pageEl, scale) {
    let layer = pageEl.querySelector('.textLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'textLayer';
      // otherwise selecting text starts a page fold
      for (const type of ['mousedown', 'touchstart']) {
        layer.addEventListener(type, (e) => e.stopPropagation());
      }
      pageEl.appendChild(layer);
    }
    layer.replaceChildren();
    layer.style.setProperty('--total-scale-factor', scale);
    await new TextLayer({
      textContentSource: page.streamTextContent(),
      container: layer,
      viewport: page.getViewport({ scale }),
    }).render();
  }

  function ensureAround(index) {
    const count = canvases.length;
    for (const n of [index + 1, Math.min(count, index + 2)]) enqueue(n, true);
    const to = Math.min(count, index + 2 + LOOKAHEAD);
    for (let n = Math.max(1, index - 2); n <= to; n++) enqueue(n, false);
  }

  function resize(width, displayWidth) {
    const changed = Math.abs(width - targetW) > targetW * 0.15
      || Math.abs(displayWidth - displayPageW) > displayPageW * 0.1;
    displayPageW = displayWidth;
    if (!changed) return false;
    targetW = width;
    for (const n of done) canvases[n - 1].width = 1;
    done.clear();
    queued.clear();
    queue.length = 0;
    return true;
  }

  function setPaused(value) {
    paused = value;
    pump();
  }

  return { render, ensureAround, resize, setPaused, renderedCount: () => done.size };
}
