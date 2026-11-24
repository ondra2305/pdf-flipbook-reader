import { createElement, ArrowLeft, ArrowRight, ZoomIn, ZoomOut, Minimize2, Download, Maximize } from 'lucide';

const ICONS = {
  prev: ArrowLeft, next: ArrowRight, zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Minimize2, download: Download, fs: Maximize,
};

const KEYS = {
  ArrowRight: 'next', ArrowLeft: 'prev', f: 'fs', '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut', 0: 'zoomFit',
};

export function renderToolbar(t) {
  for (const el of document.querySelectorAll('[data-icon]')) {
    el.replaceChildren(createElement(ICONS[el.dataset.icon], { 'aria-hidden': 'true' }));
  }
  for (const el of document.querySelectorAll('[data-title]')) el.title = t(el.dataset.title);
  for (const el of document.querySelectorAll('[data-text]')) el.textContent = t(el.dataset.text);
}

export function bindToolbar(actions) {
  for (const [id, action] of Object.entries(actions)) document.getElementById(id).onclick = action;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' && (e.ctrlKey || e.metaKey)) return;
    if (KEYS[e.key]) document.getElementById(KEYS[e.key]).click();
  });
}
