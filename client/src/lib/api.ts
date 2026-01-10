import type { GameRun, Property, Deal, InsertGameRun, InsertDeal, PropertyInvestigation, InsertPropertyInvestigation, LedgerEntry, HallOfFamePlayer, PlayerTrophy } from '@shared/schema';

const API_BASE = '/api';

export const api = {
  // Properties
  async getProperties(): Promise<Property[]> {
    const res = await fetch(`${API_BASE}/properties`);
    if (!res.ok) throw new Error('Failed to fetch properties');
    return res.json();
  },

  // Game Runs
  async createGameRun(data: InsertGameRun): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create game run');
    return res.json();
  },

  async getActiveGameRun(): Promise<GameRun | null> {
    const res = await fetch(`${API_BASE}/game-runs/active`);
    if (!res.ok) throw new Error('Failed to fetch active game run');
    return res.json();
  },

  async getGameRun(id: number): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch game run');
    return res.json();
  },

  async updateGameRun(id: number, updates: Partial<InsertGameRun>): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update game run');
    return res.json();
  },

  // Deals
  async createDeal(data: InsertDeal): Promise<Deal> {
    const res = await fetch(`${API_BASE}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create deal');
    return res.json();
  },

  async getDeals(gameRunId: number): Promise<Deal[]> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/deals`);
    if (!res.ok) throw new Error('Failed to fetch deals');
    return res.json();
  },

  // Investigations
  async createInvestigation(data: InsertPropertyInvestigation): Promise<PropertyInvestigation> {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create investigation');
    return res.json();
  },

  async getInvestigations(gameRunId: number): Promise<PropertyInvestigation[]> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/investigations`);
    if (!res.ok) throw new Error('Failed to fetch investigations');
    return res.json();
  },

  // Ledger
  async getLedger(gameRunId: number): Promise<LedgerEntry[]> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/ledger`);
    if (!res.ok) throw new Error('Failed to fetch ledger');
    return res.json();
  },

  async createLedgerEntries(
    gameRunId: number,
    entries: Array<{ direction: string; category: string; amount: number; description: string; propertyId?: number; dealId?: number }>,
    currentCash: number
  ): Promise<{ entries: LedgerEntry[], newCash: number }> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries, currentCash }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to create ledger entries');
    }
    return res.json();
  },

  // Game Mechanics
  async advanceGameWeek(gameRunId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/advance-week`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to advance game week');
    return res.json();
  },

  async activateRental(dealId: number, gameRunId: number, monthlyCashFlow: number): Promise<{
    deal: Deal;
    surpriseCosts: number;
    surpriseIssues: string[];
    newCash: number;
  }> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/activate-rental`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId, monthlyCashFlow }),
    });
    if (!res.ok) throw new Error('Failed to activate rental');
    return res.json();
  },

  async startFlipRehab(dealId: number, gameRunId: number, rehabWeeks: number): Promise<Deal> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/start-rehab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId, rehabWeeks }),
    });
    if (!res.ok) throw new Error('Failed to start flip rehab');
    return res.json();
  },

  async completeFlip(dealId: number, gameRunId: number, curveball?: any): Promise<any> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/complete-flip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId, curveball }),
    });
    if (!res.ok) throw new Error('Failed to complete flip');
    return res.json();
  },

  // Premium Purchases
  async purchaseCash(gameRunId: number, amount: number): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/purchase-cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to purchase cash');
    return res.json();
  },

  async purchaseWeeks(gameRunId: number, amount: number): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/purchase-weeks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) throw new Error('Failed to purchase weeks');
    return res.json();
  },

  async purchaseBundle(gameRunId: number, cashAmount: number, weeksAmount: number): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/purchase-bundle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cashAmount, weeksAmount }),
    });
    if (!res.ok) throw new Error('Failed to purchase bundle');
    return res.json();
  },

  // Hall of Fame
  async getOrCreatePlayer(playerName: string): Promise<HallOfFamePlayer> {
    const res = await fetch(`${API_BASE}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName }),
    });
    if (!res.ok) throw new Error('Failed to get/create player');
    return res.json();
  },

  async getHallOfFame(): Promise<(HallOfFamePlayer & { trophies: PlayerTrophy[] })[]> {
    const res = await fetch(`${API_BASE}/hall-of-fame`);
    if (!res.ok) throw new Error('Failed to fetch Hall of Fame');
    return res.json();
  },

  async getTrophyDefinitions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/trophies/definitions`);
    if (!res.ok) throw new Error('Failed to fetch trophy definitions');
    return res.json();
  },

  async awardTrophy(playerId: number, trophyId: string, gameRunId?: number): Promise<{ trophy?: PlayerTrophy; alreadyHad: boolean }> {
    const res = await fetch(`${API_BASE}/players/${playerId}/trophies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trophyId, gameRunId }),
    });
    if (!res.ok) throw new Error('Failed to award trophy');
    return res.json();
  },

  async updatePlayerStats(playerId: number, stats: {
    totalGamesPlayed?: number;
    totalDealsCompleted?: number;
    totalProfitEarned?: number;
    bestGameProfit?: number;
    gamesWon?: number;
  }): Promise<HallOfFamePlayer> {
    const res = await fetch(`${API_BASE}/players/${playerId}/stats`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    if (!res.ok) throw new Error('Failed to update player stats');
    return res.json();
  },

  async endGame(gameRunId: number, won: boolean, finalCash: number, weeksRemaining: number): Promise<{
    success: boolean;
    awardedTrophies: string[];
    playerStats: { totalGamesPlayed: number; gamesWon: number };
  }> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ won, finalCash, weeksRemaining }),
    });
    if (!res.ok) throw new Error('Failed to end game');
    return res.json();
  },
};
