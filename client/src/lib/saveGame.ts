import type { GameRun, Deal, LedgerEntry } from '@shared/schema';

const SAVE_KEY = 'dealbreak_saved_game';
const SAVE_VERSION = 1;

export interface SavedGameState {
  version: number;
  savedAt: string;
  gameRun: GameRun;
  deals: Deal[];
  ledgerEntries: LedgerEntry[];
  completedDiligence: Record<number, string[]>;
  proFormaCompletions: Record<number, boolean>;
  skippedDiligenceDeals: number[];
}

export function saveGame(state: Omit<SavedGameState, 'version' | 'savedAt'>): void {
  try {
    const saveData: SavedGameState = {
      ...state,
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (err) {
    console.error('Failed to save game:', err);
  }
}

export function loadGame(): SavedGameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved) as SavedGameState;
    
    if (data.version !== SAVE_VERSION) {
      console.warn('Save version mismatch, clearing old save');
      clearSave();
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Failed to load saved game:', err);
    return null;
  }
}

export function hasSavedGame(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error('Failed to clear save:', err);
  }
}

export function getSaveInfo(): { playerName: string; savedAt: Date; cash: number; weeksRemaining: number } | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    
    const data = JSON.parse(saved) as SavedGameState;
    return {
      playerName: data.gameRun.playerName,
      savedAt: new Date(data.savedAt),
      cash: data.gameRun.cash,
      weeksRemaining: data.gameRun.weeksRemaining,
    };
  } catch {
    return null;
  }
}
