/**
 * Utilities for match date parsing, formatting, and conflict detection.
 * Ensures teams cannot be double-booked on the same calendar date.
 */

export const getMatchDateYMD = (dateStr) => {
  if (!dateStr || String(dateStr).trim().toUpperCase() === 'TBD') return '';

  if (typeof dateStr === 'object' && dateStr?.seconds) {
    const d = new Date(dateStr.seconds * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const str = String(dateStr).trim();
  const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const day = String(dmyMatch[1]).padStart(2, '0');
    const month = String(dmyMatch[2]).padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
};

export const formatDisplayDate = (dateStr) => {
  if (!dateStr || String(dateStr).trim().toUpperCase() === 'TBD') return 'TBD';
  const ymd = getMatchDateYMD(dateStr);
  if (!ymd) return String(dateStr);
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return ymd;
};

/**
 * Checks if teamA or teamB already has a match scheduled on targetDate.
 *
 * @param {Object} params
 * @param {string} params.targetDate - Target date string (YYYY-MM-DD, ISO, etc.)
 * @param {string} params.teamA - Team A name
 * @param {string} params.teamB - Team B name
 * @param {string} [params.teamAId] - Team A document ID (optional)
 * @param {string} [params.teamBId] - Team B document ID (optional)
 * @param {Array} params.existingMatches - List of existing match objects
 * @param {string} [params.excludeMatchId] - ID of match currently being edited (to exclude self)
 * @returns {string|null} Conflict error message if conflict exists, else null.
 */
export const checkMatchDateConflict = ({
  targetDate,
  teamA,
  teamB,
  teamAId,
  teamBId,
  existingMatches = [],
  excludeMatchId = null
}) => {
  if (!targetDate) return null;
  const targetDateYMD = getMatchDateYMD(targetDate);
  if (!targetDateYMD) return null; // Blank, TBD, or unparseable dates have no conflict

  const cleanTeamA = (teamA || '').trim();
  const cleanTeamB = (teamB || '').trim();
  if (!cleanTeamA && !cleanTeamB) return null;

  const normA = cleanTeamA.toLowerCase();
  const normB = cleanTeamB.toLowerCase();

  let conflictingMatchA = null;
  let conflictingMatchB = null;

  for (const m of existingMatches) {
    if (!m) continue;
    if (excludeMatchId && m.id === excludeMatchId) continue;
    if (m.status && String(m.status).trim().toLowerCase() === 'cancelled') continue;

    const mDateYMD = getMatchDateYMD(m.date);
    if (!mDateYMD || mDateYMD !== targetDateYMD) continue;

    const mA = (m.teamA || '').trim().toLowerCase();
    const mB = (m.teamB || '').trim().toLowerCase();
    const mAId = m.teamAId;
    const mBId = m.teamBId;

    // Check conflict for Team A
    if (cleanTeamA && !conflictingMatchA) {
      const matchByName = normA && (mA === normA || mB === normA);
      const matchById = teamAId && (mAId === teamAId || mBId === teamAId);
      if (matchByName || matchById) {
        conflictingMatchA = m;
      }
    }

    // Check conflict for Team B
    if (cleanTeamB && !conflictingMatchB) {
      const matchByName = normB && (mA === normB || mB === normB);
      const matchById = teamBId && (mAId === teamBId || mBId === teamBId);
      if (matchByName || matchById) {
        conflictingMatchB = m;
      }
    }

    if (conflictingMatchA && conflictingMatchB) break;
  }

  const formattedDate = formatDisplayDate(targetDateYMD);

  if (conflictingMatchA && conflictingMatchB) {
    if (conflictingMatchA.id === conflictingMatchB.id) {
      return `Date already scheduled: "${cleanTeamA}" vs "${cleanTeamB}" is already scheduled on this date (${formattedDate}).`;
    }
    return `Date already scheduled: Both "${cleanTeamA}" and "${cleanTeamB}" already have a match scheduled on this date (${formattedDate}).`;
  }

  if (conflictingMatchA) {
    const opp = (conflictingMatchA.teamA && conflictingMatchA.teamA.trim().toLowerCase() !== normA)
      ? conflictingMatchA.teamA
      : conflictingMatchA.teamB;
    const vsText = opp ? ` (vs ${opp})` : '';
    return `Date already scheduled: "${cleanTeamA}" already has a match${vsText} scheduled on this date (${formattedDate}).`;
  }

  if (conflictingMatchB) {
    const opp = (conflictingMatchB.teamA && conflictingMatchB.teamA.trim().toLowerCase() !== normB)
      ? conflictingMatchB.teamA
      : conflictingMatchB.teamB;
    const vsText = opp ? ` (vs ${opp})` : '';
    return `Date already scheduled: "${cleanTeamB}" already has a match${vsText} scheduled on this date (${formattedDate}).`;
  }

  return null;
};
