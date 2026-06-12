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

  const canvas = await html2canvas(el, {
    scale: 4,
    useCORS: true,
    backgroundColor: null,
    logging: false,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL('image/png');

  // CR80 landscape format: 85.6 x 54mm
  const PDF_W = 85.6;
  const PDF_H = 54;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PDF_W, PDF_H],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);

  return pdf.output('blob');
};

/**
 * Download the PDF directly to the user's device.
 * @param {string} elementId
 * @param {string} fileName
 */
export const downloadIDCardPDF = async (elementId = 'player-card-render', fileName = 'TRIVAB-ID-Card.pdf') => {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 4,
    useCORS: true,
    logging: false,
    backgroundColor: null,
    allowTaint: true,
  });

  const imgData = canvas.toDataURL('image/png');

  // CR80 landscape: 85.6 x 54mm — matches card design
  const PDF_W = 85.6;
  const PDF_H = 54;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PDF_W, PDF_H],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, PDF_W, PDF_H);
  pdf.save(fileName);
};
