const ICONS = {
  prev: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  next: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  zoomIn: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>',
  zoomOut: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/>',
  fit: '<polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>',
  fs: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
};

const KEYS = {
  ArrowRight: 'next', ArrowLeft: 'prev', f: 'fs', '+': 'zoomIn', '=': 'zoomIn', '-': 'zoomOut', 0: 'zoomFit',
};

export function renderToolbar(t) {
  for (const el of document.querySelectorAll('[data-icon]')) {
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[el.dataset.icon]}</svg>`;
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
