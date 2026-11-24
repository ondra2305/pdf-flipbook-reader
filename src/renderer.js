import { TextLayer } from 'pdfjs-dist';

const LOOKAHEAD = matchMedia('(pointer: coarse)').matches ? 3 : 5;
const KEEP_BEHIND = 4;
const CONCURRENCY = 2;

export function createRenderer({ pdf, canvases, aspect, textLayer, onError }) {
  const done = new Set();
  const queue = [];
  const queued = new Set();
  const inFlight = new Map();
  let active = 0;
  let paused = false;
  let targetW = 800;
  let displayPageW = 400;
  let generation = 0;
  const resumers = [];
  const texts = new Map();
  let visible = new Set();

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
    let drawnFor;
    do {
      drawnFor = generation;
      await paint(page, base, canvas);
    } while (drawnFor !== generation);
    done.add(n);
    showText(n);
  }

  async function paint(page, base, canvas) {
    canvas.width = targetW;
    canvas.height = Math.round((targetW * base.height) / base.width);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const task = page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: targetW / base.width }) });
    task.onContinue = (resume) => (paused ? resumers.push(resume) : resume());
    await task.promise;
  }

  function showText(n) {
    if (!textLayer || texts.has(n) || !visible.has(n) || !done.has(n)) return;
    const layer = document.createElement('div');
    layer.className = 'textLayer';
    // otherwise selecting text starts a page fold
    for (const type of ['mousedown', 'touchstart']) {
      layer.addEventListener(type, (e) => e.stopPropagation());
    }
    canvases[n - 1].parentElement.appendChild(layer);
    texts.set(n, layer);
    pdf.getPage(n).then((page) => drawText(page, layer)).catch((err) => onError(n, err));
  }

  function hideText(n) {
    texts.get(n)?.remove();
    texts.delete(n);
  }

  async function drawText(page, layer) {
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(displayPageW / base.width, displayPageW / aspect / base.height);
    layer.style.setProperty('--total-scale-factor', scale);
    await new TextLayer({
      textContentSource: page.streamTextContent(),
      container: layer,
      viewport: page.getViewport({ scale }),
    }).render();
  }

  function free(n) {
    canvases[n - 1].width = 1;
    canvases[n - 1].height = 1;
    done.delete(n);
    hideText(n);
  }

  function ensureAround(index) {
    const count = canvases.length;
    const to = Math.min(count, index + 2 + LOOKAHEAD);
    visible = new Set([index + 1, index + 2]);
    for (const n of texts.keys()) if (!visible.has(n)) hideText(n);
    for (const n of visible) showText(n);
    for (const n of done) if (n < index - KEEP_BEHIND || n > to) free(n);
    for (const n of [index + 1, Math.min(count, index + 2)]) enqueue(n, true);
    for (let n = Math.max(1, index - 2); n <= to; n++) enqueue(n, false);
  }

  function resize(width, displayWidth) {
    const changed = Math.abs(width - targetW) > targetW * 0.15
      || Math.abs(displayWidth - displayPageW) > displayPageW * 0.1;
    displayPageW = displayWidth;
    if (!changed) return false;
    targetW = width;
    generation++;
    for (const n of done) free(n);
    queued.clear();
    queue.length = 0;
    return true;
  }

  function setPaused(value) {
    paused = value;
    if (!paused) resumers.splice(0).forEach((resume) => resume());
    pump();
  }

  return { render, ensureAround, resize, setPaused, renderedCount: () => done.size };
}
