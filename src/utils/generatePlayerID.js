/**
 * Generate a unique Player ID
 * Format: TRIVAB-{TEAM_CODE}-{YEAR}-{5-digit-random}
 * Example: TRIVAB-MUM-2026-00142
 */
export const generatePlayerID = (teamName = 'GEN') => {
  const teamCode = teamName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 3)
    .padEnd(3, 'X');
  const year = new Date().getFullYear();
  const rand = String(Math.floor(10000 + Math.random() * 89999));
  return `TRIVAB-${teamCode}-${year}-${rand}`;
};
