import { BLACK, WHITE } from './constants.js';

const STORAGE_KEY = 'browser-chess-state-v1';

const isValidPiece = (piece) =>
  piece === null ||
  (typeof piece === 'object' && 'kpnbrq'.includes(piece.type) && [WHITE, BLACK].includes(piece.color));

function isValidState(state) {
  return (
    state &&
    Array.isArray(state.board) &&
    state.board.length === 8 &&
    state.board.every((row) => Array.isArray(row) && row.length === 8 && row.every(isValidPiece)) &&
    [WHITE, BLACK].includes(state.turn) &&
    state.castlingRights?.[WHITE] &&
    state.castlingRights?.[BLACK] &&
    Array.isArray(state.captured?.[WHITE]) &&
    Array.isArray(state.captured?.[BLACK]) &&
    typeof state.status === 'string'
  );
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or unavailable (private mode); game continues in memory.
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
