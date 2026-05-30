import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';

// ── Generic helpers ──────────────────────────────────────────
export const getDocument = async (col, id) => {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const setDocument = (col, id, data) =>
  setDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });

export const addDocument = (col, data) =>
  addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() });

export const updateDocument = (col, id, data) =>
  updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() });

export const deleteDocument = (col, id) => deleteDoc(doc(db, col, id));

export const getCollection = async (col, constraints = []) => {
  const q = query(collection(db, col), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeCollection = (col, constraints, callback) => {
  const q = query(collection(db, col), ...constraints);
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

// ── Players ──────────────────────────────────────────────────
export const getPlayerByUID = (uid) =>
  getCollection('players', [where('uid', '==', uid), limit(1)]).then((r) => r[0] || null);

export const getPlayersByTeam = (teamId) =>
  getCollection('players', [where('teamId', '==', teamId), orderBy('createdAt', 'desc')]);

// ── Teams ────────────────────────────────────────────────────
export const getAllTeams = () =>
  getCollection('teams', [orderBy('teamName')]);

// ── Tournaments ──────────────────────────────────────────────
export const getAllTournaments = () =>
  getCollection('tournaments', [orderBy('createdAt', 'desc')]);

// ── Matches ──────────────────────────────────────────────────
export const getMatchesByTournament = (tournamentId) =>
  getCollection('matches', [
    where('tournamentId', '==', tournamentId),
    orderBy('date'),
  ]);

export const getAllMatches = () =>
  getCollection('matches', [orderBy('date')]);

// ── Sponsors ─────────────────────────────────────────────────
export const getAllSponsors = () =>
  getCollection('sponsors', [orderBy('displayOrder')]);

// ── QR Scan Logs ─────────────────────────────────────────────
export const logQRScan = (data) => addDocument('qr_scan_logs', data);

export { serverTimestamp, where, orderBy, limit };
