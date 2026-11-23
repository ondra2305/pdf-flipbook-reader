const STRINGS = {
  cs: {
    prevTitle: 'Předchozí strana (←)', nextTitle: 'Další strana (→)',
    zoomIn: 'Přiblížit (+)', zoomOut: 'Oddálit (−)',
    zoomFit: 'Přizpůsobit', zoomFitTitle: 'Přizpůsobit stránku (0)', zoomFitShort: 'Auto',
    download: 'Stáhnout', downloadTitle: 'Stáhnout PDF',
    fullscreen: 'Celá obrazovka', fullscreenTitle: 'Celá obrazovka (F)',
    langToggle: 'EN', langToggleTitle: 'Přepnout do angličtiny',
    noPdf: 'Chybí parametr ?pdf= s adresou dokumentu.',
    badOrigin: 'Dokument musí být ze stejného serveru.',
    loading: 'Načítám PDF…', error: 'Chyba: ',
    renderPage: (n, e) => `vykreslení strany ${n}: ${e}`,
    downloadFail: (e) => `stažení souboru: ${e}`,
  },
  en: {
    prevTitle: 'Previous page (←)', nextTitle: 'Next page (→)',
    zoomIn: 'Zoom in (+)', zoomOut: 'Zoom out (−)',
    zoomFit: 'Fit', zoomFitTitle: 'Fit page (0)', zoomFitShort: 'Fit',
    download: 'Download', downloadTitle: 'Download PDF',
    fullscreen: 'Fullscreen', fullscreenTitle: 'Fullscreen (F)',
    langToggle: 'CZ', langToggleTitle: 'Switch to Czech',
    noPdf: 'Missing the ?pdf= parameter with the document URL.',
    badOrigin: 'The document must be served from this site.',
    loading: 'Loading PDF…', error: 'Error: ',
    renderPage: (n, e) => `rendering page ${n}: ${e}`,
    downloadFail: (e) => `download: ${e}`,
  },
};

export function translator(lang) {
  return (key, ...args) => {
    const value = STRINGS[lang][key];
    return typeof value === 'function' ? value(...args) : value;
  };
}
