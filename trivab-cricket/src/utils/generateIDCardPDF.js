import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate a PDF from the ID card DOM element and return as Blob.
 * @param {string} elementId - The DOM element ID to capture
 * @returns {Promise<Blob>}
 */
export const generateIDCardPDF = async (elementId = 'player-id-card') => {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('ID card element not found');

  const canvas = await html2canvas(el, {
    scale: 3,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [85, 135],
  });

  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (canvas.height * pdfW) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);

  return pdf.output('blob');
};

/**
 * Download the PDF directly to the user's device.
 */
export const downloadIDCardPDF = async (elementId, fileName = 'TRIVAB-ID-Card.pdf') => {
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, { scale: 3, useCORS: true, logging: false });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 135] });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (canvas.height * pdfW) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
  pdf.save(fileName);
};
