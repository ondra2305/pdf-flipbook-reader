import { MIN_PAGE_W } from './book.js';

const ZOOM_STEPS = [1, 1.5, 2, 3];
const STAGE_PADDING = 24;

export function createViewport({ aspect, single, onFit, onResize }) {
  const stage = document.getElementById('stage');
  const viewport = document.getElementById('viewport');
  const sizer = document.getElementById('sizer');
  const book = document.getElementById('book');
  const zoomLabel = document.getElementById('zoomLabel');
  let zoomIdx = 0;

  function fit() {
    const box = stage.getBoundingClientRect();
    const availW = box.width - STAGE_PADDING;
    const availH = box.height - STAGE_PADDING;
    const pagesAcross = single || availW < 2 * MIN_PAGE_W ? 1 : 2;
    const shownW = Math.floor(Math.min(availW, availH * pagesAcross * aspect));
    const pageW = shownW / pagesAcross;
    // StPageFlip draws hard pages at top 0, so the book must not be taller than a page
    const shownH = Math.floor(pageW / aspect);
    book.style.width = shownW + 'px';
    book.style.height = shownH + 'px';

    const zoom = ZOOM_STEPS[zoomIdx];
    sizer.style.width = Math.floor(shownW * zoom) + 'px';
    sizer.style.height = Math.floor(shownH * zoom) + 'px';
    viewport.style.overflow = zoomIdx > 0 ? 'auto' : 'hidden';
    book.style.transform = zoom === 1 ? 'none' : `scale(${zoom})`;
    zoomLabel.textContent = Math.round(zoom * 100) + '%';

    const density = Math.min(2.5, Math.max(2, (window.devicePixelRatio || 1) * 1.5));
    const pixelW = Math.round(pageW * zoom * density);
    onFit(Math.max(600, Math.min(zoomIdx > 0 ? 3000 : 2200, pixelW)), Math.max(120, pageW));
  }

  function setZoom(idx) {
    zoomIdx = Math.min(Math.max(idx, 0), ZOOM_STEPS.length - 1);
    fit();
  }

  function refit() {
    fit();
    onResize();
  }

  new ResizeObserver(refit).observe(stage);
  window.addEventListener('resize', refit);
  // StPageFlip only listens to window resize, which fullscreen changes don't fire
  document.addEventListener('fullscreenchange', () => setTimeout(refit, 60));

  // StPageFlip pointer math ignores CSS scale, so zoom disables flip gestures and pans instead
  const grabsPan = (e) => zoomIdx > 0 && !e.target.closest('.textLayer span');
  let pan = null;
  viewport.addEventListener('mousedown', (e) => {
    if (!grabsPan(e)) return;
    e.stopPropagation();
    e.preventDefault();
    pan = { x: e.clientX, y: e.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
  }, true);
  window.addEventListener('mousemove', (e) => {
    if (!pan) return;
    viewport.scrollLeft = pan.left - (e.clientX - pan.x);
    viewport.scrollTop = pan.top - (e.clientY - pan.y);
  });
  window.addEventListener('mouseup', () => { pan = null; });
  viewport.addEventListener('touchstart', (e) => {
    if (grabsPan(e)) e.stopPropagation();
  }, true);

  return {
    fit,
    zoomIn: () => setZoom(zoomIdx + 1),
    zoomOut: () => setZoom(zoomIdx - 1),
    zoomReset: () => setZoom(0),
    toggleFullscreen: () => (document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen?.()),
  };
}
