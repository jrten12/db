import type { GameRun, Deal, LedgerEntry, PropertyInvestigation } from '@shared/schema';

const SAVE_KEY = 'dealbreak_saved_game';
const SAVE_VERSION = 2;

export interface SavedGameState {
  version: number;
  savedAt: string;
  gameRun: GameRun;
  deals: Deal[];
  ledgerEntries: LedgerEntry[];
  investigations: PropertyInvestigation[];
  completedDiligence: Record<number, string[]>;
  proFormaCompletions: Record<number, boolean>;
  skippedDiligenceDeals: number[];
}

export function saveGame(state: Omit<SavedGameState, 'version' | 'savedAt'>): void {
  try {
    if (state.gameRun.weeksRemaining <= 0 || state.gameRun.status !== 'active') {
      clearSave();
      return;
    }
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

    if (data.gameRun.weeksRemaining <= 0 || data.gameRun.status !== 'active') {
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
  return getSaveInfo() !== null;
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

    if (data.gameRun.weeksRemaining <= 0 || data.gameRun.status !== 'active') {
      clearSave();
      return null;
    }

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
