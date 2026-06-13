import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a PDF from the ID card DOM element and return as Blob.
 * Landscape CR80 card: 85.6mm × 54mm
 * @param {string} elementId - The DOM element ID to capture
 * @returns {Promise<Blob>}
 */
export const generateIDCardPDF = async (elementId = 'player-card-render') => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('ID card element not found');

  // Clone the element to render in isolation
  const clone = el.cloneNode(true);
  clone.classList.add('pdf-clone');
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.width = '380px';
  clone.style.height = '240px';
  clone.style.boxSizing = 'border-box';
  document.body.appendChild(clone);

  // Small delay to ensure styles and images render in the DOM
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    const canvas = await html2canvas(clone, {
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: '#0a0f1a', // Fallback background color
      allowTaint: true,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/png');
    const PDF_W = 85.6;
    const PDF_H = 54;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [PDF_W, PDF_H],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);
    document.body.removeChild(clone);
    return pdf.output('blob');
  } catch (err) {
    document.body.removeChild(clone);
    throw err;
  }
};

/**
 * Download the PDF directly to the user's device.
 * @param {string} elementId
 * @param {string} fileName
 */
export const downloadIDCardPDF = async (elementId = 'player-card-render', fileName = 'TRIVAB-ID-Card.pdf') => {
  const el = document.getElementById(elementId);
  if (!el) return;

  // Clone the element to render in isolation
  const clone = el.cloneNode(true);
  clone.classList.add('pdf-clone');
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '-9999px';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.width = '380px';
  clone.style.height = '240px';
  clone.style.boxSizing = 'border-box';
  document.body.appendChild(clone);

  // Small delay to ensure styles and images render in the DOM
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const canvas = await html2canvas(clone, {
      scale: 4,
      useCORS: true,
      logging: false,
      backgroundColor: '#0a0f1a', // Fallback background color
      allowTaint: true,
      scrollX: 0,
      scrollY: 0
    });

    const imgData = canvas.toDataURL('image/png');
    const PDF_W = 85.6;
    const PDF_H = 54;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [PDF_W, PDF_H],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);
    pdf.save(fileName);
  } catch (err) {
    console.error("PDF download failed:", err);
  } finally {
    document.body.removeChild(clone);
  }
};
