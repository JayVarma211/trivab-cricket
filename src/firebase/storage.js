import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file Blob/File to Firebase Storage.
 * @param {Blob|File} file
 * @param {string} path  - Storage path e.g. "player-pdfs/TRIVAB-MUM-2026-00142.pdf"
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = async (file, path) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

/**
 * Upload player photo and return URL.
 */
export const uploadPlayerPhoto = (file, playerId) =>
  uploadFile(file, `player-photos/${playerId}`);

/**
 * Upload player ID card PDF and return URL.
 */
export const uploadPlayerPDF = (blob, playerId) =>
  uploadFile(blob, `player-pdfs/${playerId}.pdf`);

/**
 * Upload player QR code image and return URL.
 */
export const uploadPlayerQR = (blob, playerId) =>
  uploadFile(blob, `player-qrcodes/${playerId}.png`);

/**
 * Upload sponsor logo and return URL.
 */
export const uploadSponsorLogo = (file, sponsorId) =>
  uploadFile(file, `sponsor-logos/${sponsorId}`);
