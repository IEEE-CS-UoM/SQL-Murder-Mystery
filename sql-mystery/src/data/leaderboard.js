const STORAGE_KEY = 'sql-mystery-leaderboard';

export function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveScore(entry) {
  const nextEntries = [...loadLeaderboard(), entry];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
}

export function clearLeaderboard() {
  localStorage.removeItem(STORAGE_KEY);
}
