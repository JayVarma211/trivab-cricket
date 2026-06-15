import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CARD_W = 380;
const CARD_H = 240;
const PDF_W  = 85.6; // mm — standard CR80 card width
const PDF_H  = 54;   // mm — standard CR80 card height

/**
 * Capture a DOM element as a properly-aligned canvas and return as image data.
 * @param {HTMLElement} el
 * @returns {Promise<string>} - base64 png
 */
async function captureElement(el) {
  return html2canvas(el, {
    scale:           3,           // 3× pixel density — crisp at print resolution
    useCORS:         true,
    allowTaint:      true,
    logging:         false,
    backgroundColor: '#0a0f1a',  // card background colour fallback
    // Force the canvas to exactly match the card dimensions so nothing is cut off
    width:           CARD_W,
    height:          CARD_H,
    // Scroll offsets must be 0 — we're using a fixed off-screen clone
    scrollX:         0,
    scrollY:         0,
    // windowWidth/Height prevent html2canvas from mis-scaling relative units
    windowWidth:     CARD_W,
    windowHeight:    CARD_H,
    x:               0,
    y:               0,
    // Disable image smoothing for pixel-perfect edges
    imageTimeout:    5000,
    onclone: (document, clonedEl) => {
      // Ensure the cloned element has no transforms or box-shadow that could cause offsets
      clonedEl.style.transform  = 'none';
      clonedEl.style.boxShadow  = 'none';
      clonedEl.style.margin     = '0';
      clonedEl.style.position   = 'absolute';
      clonedEl.style.top        = '0';
      clonedEl.style.left       = '0';
      clonedEl.style.width      = `${CARD_W}px`;
      clonedEl.style.height     = `${CARD_H}px`;
      clonedEl.style.borderRadius = '0'; // Flat for print
      clonedEl.style.overflow   = 'hidden';
    }
  });
}

/**
 * Create a temporary off-screen clone of the target element,
 * capture it, then remove the clone.
 */
async function createAndCaptureClone(el) {
  // Force-load all images inside the element
  const imgs = el.querySelectorAll('img');
  await Promise.all(Array.from(imgs).map(img =>
    img.complete
      ? Promise.resolve()
      : new Promise(res => { img.onload = res; img.onerror = res; })
  ));

  const clone = el.cloneNode(true);
  clone.classList.add('pdf-clone');
  clone.style.cssText = `
    position: fixed;
    top: 0;
    left: -${CARD_W + 100}px;
    width: ${CARD_W}px;
    height: ${CARD_H}px;
    margin: 0;
    padding: 0;
    transform: none;
    box-shadow: none;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: 0;
    z-index: 99999;
  `;
  document.body.appendChild(clone);

  // Wait for fonts + any lazy-loaded resources
  await new Promise(resolve => setTimeout(resolve, 250));

  try {
    const canvas = await captureElement(clone);
    return canvas;
  } finally {
    document.body.removeChild(clone);
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
  }
};
