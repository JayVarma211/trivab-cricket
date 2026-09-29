import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CARD_W = 1050;
const CARD_H = 600;
const PDF_W  = 105; // mm — standard pass dimensions (7:4 aspect ratio, 105mm x 60mm)
const PDF_H  = 60;  // mm

/**
 * Capture a DOM element as a properly-aligned canvas and return as a canvas element.
 * @param {HTMLElement} el
 * @returns {Promise<HTMLCanvasElement>}
 */
async function captureElement(el) {
  return html2canvas(el, {
    scale:           2,           // 2× density on 1050x600 = 2100x1200 ultra-crisp resolution
    useCORS:         true,
    allowTaint:      true,
    logging:         false,
    backgroundColor: '#050608',  // card background colour fallback
    width:           CARD_W,
    height:          CARD_H,
    scrollX:         0,
    scrollY:         0,
    windowWidth:     1200,
    windowHeight:    800,
    x:               0,
    y:               0,
    imageTimeout:    10000,
    onclone: (clonedDoc, clonedEl) => {
      // Reset any layout-shifting properties on the card itself
      clonedEl.style.transform    = 'none';
      clonedEl.style.boxShadow    = 'none';
      clonedEl.style.margin       = '0';
      clonedEl.style.position     = 'absolute';
      clonedEl.style.top          = '0';
      clonedEl.style.left         = '0';
      clonedEl.style.width        = `${CARD_W}px`;
      clonedEl.style.height       = `${CARD_H}px`;
      clonedEl.style.borderRadius = '24px';
      clonedEl.style.overflow     = 'hidden';

      // Copy computed font-size from the live document root
      const liveRoot       = document.documentElement;
      const liveRootStyle  = getComputedStyle(liveRoot);
      const clonedRoot     = clonedDoc.documentElement;
      clonedRoot.style.fontSize = liveRootStyle.fontSize || '16px';

      // Inject custom CSS variables into clone root
      const cssVarText = Array.from(document.styleSheets)
        .flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules || []);
          } catch {
            return [];
          }
        })
        .filter(rule => rule.selectorText === ':root')
        .map(rule => rule.cssText)
        .join('\n');

      if (cssVarText) {
        const styleEl = clonedDoc.createElement('style');
        styleEl.textContent = cssVarText;
        clonedDoc.head.appendChild(styleEl);
      }
    }
  });
}

/**
 * Create a temporary off-screen clone of the target element,
 * capture it, then remove the clone.
 * @param {HTMLElement} el
 * @returns {Promise<HTMLCanvasElement>}
 */
async function createAndCaptureClone(el) {
  // Force-load all images inside the element before cloning
  const imgs = el.querySelectorAll('img');
  await Promise.all(Array.from(imgs).map(img =>
    img.complete
      ? Promise.resolve()
      : new Promise(res => { img.onload = res; img.onerror = res; })
  ));

  // Place clone off-screen but within the document flow
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: fixed;
    top: 0;
    left: -${CARD_W + 500}px;
    width: ${CARD_W}px;
    height: ${CARD_H}px;
    overflow: hidden;
    pointer-events: none;
    z-index: 999999;
  `;

  const clone = el.cloneNode(true);
  clone.classList.add('pdf-clone');
  clone.style.cssText = `
    width: ${CARD_W}px !important;
    height: ${CARD_H}px !important;
    min-width: ${CARD_W}px !important;
    min-height: ${CARD_H}px !important;
    margin: 0 !important;
    padding: 0 !important;
    transform: none !important;
    box-shadow: none !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    border-radius: 24px !important;
    position: static !important;
    flex-shrink: 0 !important;
  `;

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Wait for fonts and any lazy-loaded resources to render
  await document.fonts.ready;
  await new Promise(resolve => setTimeout(resolve, 300));

  try {
    const canvas = await captureElement(clone);
    return canvas;
  } finally {
    document.body.removeChild(wrapper);
  }
}

/**
 * Generate a Blob containing the PDF ID card.
 * @param {string} elementId
 * @returns {Promise<Blob>}
 */
export const generateIDCardPDF = async (elementId = 'player-card-render') => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('ID card element not found');

  const canvas  = await createAndCaptureClone(el);
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit:        'mm',
    format:      [PDF_W, PDF_H],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);
  return pdf.output('blob');
};

/**
 * Download the PDF ID card directly to the user's device.
 * @param {string} elementId
 * @param {string} fileName
 */
export const downloadIDCardPDF = async (
  elementId = 'player-card-render',
  fileName  = 'TRIVAB-ID-Card.pdf'
) => {
  const el = document.getElementById(elementId);
  if (!el) return;

  try {
    const canvas  = await createAndCaptureClone(el);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit:        'mm',
      format:      [PDF_W, PDF_H],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);
    pdf.save(fileName);
  } catch (err) {
    console.error('PDF download failed:', err);
    throw err;
  }
};

