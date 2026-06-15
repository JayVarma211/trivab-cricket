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
import { sendCaptainRosterNotification } from '../services/email';

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
export const getPlayerByUID = async (uid) => {
  const players = await getCollection('players', [where('uid', '==', uid), limit(1)]);
  if (players && players.length > 0) return players[0];
  return getDocument('players', uid);
};

export const getPlayerByEmail = async (email) => {
  if (!email) return null;
  const players = await getCollection('players', [where('email', '==', email), limit(1)]);
  return players && players.length > 0 ? players[0] : null;
};

export const getPlayerByUIDOrEmail = async (uid, email) => {
  let player = await getPlayerByUID(uid);
  if (player) return player;
  
  player = await getPlayerByEmail(email);
  if (player) return player;

  try {
    const captain = await getDocument('captains', uid);
    if (captain) {
      const generatedId = `PL-${uid.substring(0, 5).toUpperCase()}`;
      const playerProfileData = {
        playerId: generatedId,
        uid: uid,
        fullName: captain.fullName,
        mobile: captain.mobile || '',
        email: captain.email || email || '',
        teamId: captain.teamId || '',
        teamName: captain.teamName || '',
        playingStyle: 'All-Rounder',
        jerseyNumber: '7',
        photoURL: captain.photoURL || '',
        qrValue: generatedId,
        qrCodeURL: '',
        pdfURL: '',
        status: 'Active',
        createdAt: new Date().toISOString(),
        joinedTournaments: []
      };
      await setDocument('players', generatedId, playerProfileData);
      return playerProfileData;
    }
  } catch (err) {
    console.error("Auto-provision fallback failed for captain:", err);
  }

  return null;
};

export const getPlayerByUIDFallback = async (uid) => {
  const player = await getPlayerByUID(uid);
  if (player) return player;
  return getDocument('players', uid);
};

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

export const syncTeamRosterCountAndNotify = async (teamId) => {
  if (!teamId) return;
  try {
    const teamObj = await getDocument('teams', teamId);
    if (!teamObj) return;

    const teamRegs = await getCollection('registrations', [where('teamId', '==', teamId)]);
    const hasCaptainInRegs = teamRegs.some(r => r.role === 'captain');

    let actualCount = teamRegs.length;
    if (!hasCaptainInRegs && teamObj.captainId) {
      actualCount += 1;
    }

    await updateDocument('teams', teamId, {
      playerCount: actualCount
    });

    if (actualCount > 0 && actualCount % 10 === 0) {
      let captainEmail = '';
      let captainName = '';

      if (teamObj.captainId) {
        const captainDoc = await getDocument('captains', teamObj.captainId);
        if (captainDoc) {
          captainEmail = captainDoc.email;
          captainName = captainDoc.fullName;
        }
      }

      if (!captainEmail) {
        const captainReg = teamRegs.find(r => r.role === 'captain');
        if (captainReg) {
          captainEmail = captainReg.playerEmail;
          captainName = captainReg.playerName;
        }
      }

      if (!captainEmail) {
        const captainsWithTeam = await getCollection('captains', [where('teamId', '==', teamId)]);
        if (captainsWithTeam && captainsWithTeam.length > 0) {
          captainEmail = captainsWithTeam[0].email;
          captainName = captainsWithTeam[0].fullName;
        }
      }

      if (!captainName && teamObj.captainName) {
        captainName = teamObj.captainName;
      }

      if (captainEmail) {
        await sendCaptainRosterNotification(
          captainEmail,
          captainName || 'Captain',
          teamObj.teamName,
          actualCount
        );
      } else {
        console.warn(`Could not find captain email for team ${teamObj.teamName} (${teamId}) to send notification.`);
      }
    }
  } catch (err) {
    console.error("Failed to sync team roster count and notify:", err);
  }
};

export { serverTimestamp, where, orderBy, limit };
