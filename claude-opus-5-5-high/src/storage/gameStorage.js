import { computeStatus, isValidGameState } from '../engine/index.js';

const STORAGE_KEY = 'browser-chess:game-state:v1';

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!isValidGameState(state)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ...state, status: computeStatus(state) };
  } catch (error) {
    console.warn('Could not load saved game, starting a new one.', error);
    return null;
  }
}

export function saveGame(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save game state.', error);
  }
}
