import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';

const BASE_W = 400;
export const MIN_PAGE_W = 220;

export function createBook(el, { pageCount, pageWidth, pageHeight, magazine, onTurn, onFlipping }) {
  const height = Math.round((BASE_W * pageHeight) / pageWidth);
  const canvases = [];
  for (let i = 0; i < pageCount; i++) {
    const page = document.createElement('div');
    page.className = 'page';
    page.style.width = BASE_W + 'px';
    page.style.height = height + 'px';
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    page.appendChild(canvas);
    canvases.push(canvas);
  }
  el.append(...canvases.map((canvas) => canvas.parentElement));

  const pageFlip = new PageFlip(el, {
    width: BASE_W,
    height,
    size: 'stretch',
    minWidth: MIN_PAGE_W,
    usePortrait: true,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false,
    flippingTime: 650,
  });
  pageFlip.loadFromHTML(el.querySelectorAll('.page'));
  // showCover forces hard density on the cover; magazine mode curls it like other pages
  const pageList = pageFlip.getPageCollection()?.pages;
  if (magazine && Array.isArray(pageList)) {
    for (const page of pageList) page.setDensity?.('soft');
  }
  el.classList.add('stf-ready');

  let flipping = false;
  let pendingNext = 0;
  let pendingPrev = 0;

  pageFlip.on('flip', onTurn);
  pageFlip.on('changeState', (e) => {
    if (e.data === 'flipping' || e.data === 'user_fold') {
      flipping = true;
      onFlipping(true);
    }
    if (e.data === 'read') {
      flipping = false;
      onFlipping(false);
      // flipping synchronously inside this event re-enters StPageFlip mid-cleanup and freezes it
      setTimeout(() => {
        if (document.hidden) return;
        if (pendingNext > 0) { pendingNext--; pageFlip.flipNext(); }
        else if (pendingPrev > 0) { pendingPrev--; pageFlip.flipPrev(); }
      }, 0);
    }
  });

  return {
    canvases,
    aspect: BASE_W / height,
    current: () => pageFlip.getCurrentPageIndex(),
    update: () => pageFlip.update(),
    next() {
      if (flipping) pendingNext = Math.min(pendingNext + 1, 6);
      else pageFlip.flipNext();
    },
    prev() {
      if (flipping) pendingPrev = Math.min(pendingPrev + 1, 6);
      else pageFlip.flipPrev();
    },
  };
}
