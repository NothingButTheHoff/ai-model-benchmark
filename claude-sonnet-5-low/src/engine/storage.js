const KEY = 'chess-game-state-v1';

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Storage may be unavailable (private mode, quota). Game continues without persistence.
    console.warn('Failed to save game state', e);
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load game state', e);
    return null;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn('Failed to clear game state', e);
  }
}
