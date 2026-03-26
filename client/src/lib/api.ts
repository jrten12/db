import type { GameRun, Property, Deal, InsertGameRun, InsertDeal, PropertyInvestigation, InsertPropertyInvestigation, LedgerEntry, HallOfFamePlayer, PlayerTrophy, Tenant, InsertTenant } from '@shared/schema';

const API_BASE = '/api';

export interface LtvOption {
  ltv: number;
  newLoanAmount: number;
  cashOut: number;
  refinanceFees: number;
  monthlyPayment: number;
}

export interface RefinanceOptions {
  eligible: boolean;
  weeksUntilEligible?: number;
  reason?: string;
  currentMarketValue?: number;
  currentLoanBalance?: number;
  currentEquity?: number;
  equityPercent?: number;
  interestRate?: number;
  refinanceFeePct?: number;
  minLtv?: number;
  maxLtv?: number;
  ltvOptions?: LtvOption[];
  playerMetrics?: {
    dti: number;
    cashReserves: number;
    reserveMonths: number;
  };
}

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

  async getActiveGameByPlayer(playerName: string): Promise<GameRun | null> {
    const res = await fetch(`${API_BASE}/game-runs/player/${encodeURIComponent(playerName)}`);
    if (!res.ok) throw new Error('Failed to fetch game by player');
    return res.json();
  },

  async deleteGameRun(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/game-runs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete game run');
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

  async restoreGameRunData(gameRunId: number, data: {
    deals: Deal[];
    investigations: PropertyInvestigation[];
    ledgerEntries: LedgerEntry[];
  }): Promise<{ deals: Deal[]; investigations: PropertyInvestigation[]; ledgerEntries: LedgerEntry[] }> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to restore game run data');
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

  // Achievements
  async getAchievements(gameRunId: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/achievements`);
    if (!res.ok) throw new Error('Failed to fetch achievements');
    return res.json();
  },

  async unlockAchievement(gameRunId: number, achievementId: string, metadata?: any): Promise<any> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/achievements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievementId, metadata }),
    });
    if (!res.ok) throw new Error('Failed to unlock achievement');
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
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (res.status === 429) {
        throw new Error(body?.message || 'Slow down — wait a moment before skipping again.');
      }
      throw new Error(body?.message || 'Failed to advance month');
    }
    return res.json();
  },

  async activateRental(dealId: number, gameRunId: number): Promise<{
    deal: Deal;
    surpriseCosts: number;
    surpriseIssues: string[];
    titleIssue?: {
      name: string;
      cost: number;
    };
    newCash: number;
    realityCheck?: {
      projectedCashFlow: number;
      actualCashFlow: number;
      rentDelta: number;
      vacancyDelta: number;
      explanation: string;
      wasOptimistic: boolean;
    };
    awardedTrophies?: string[];
  }> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/activate-rental`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId }),
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

  async sellRental(dealId: number, gameRunId: number): Promise<{
    deal: Deal;
    gameRun: GameRun;
    saleProfit: number;
    salePrice: number;
    purchasePrice: number;
    mortgagePayoff: number;
    netProceeds: number;
  }> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      if (res.status === 429) {
        throw new Error(err?.message || 'Please wait a moment before trying again.');
      }
      throw new Error(err?.error || err?.message || 'Failed to sell rental');
    }
    return res.json();
  },

  async sellFlip(dealId: number, gameRunId: number): Promise<{
    deal: Deal;
    gameRun: GameRun;
    saleProfit: number;
    salePrice: number;
    purchasePrice: number;
    netProceeds: number;
    mortgagePayoff: number;
    awardedTrophies?: string[];
  }> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/sell-flip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      if (res.status === 429) {
        throw new Error(err?.message || 'Please wait a moment before trying again.');
      }
      throw new Error(err?.error || err?.message || 'Failed to sell flip property');
    }
    return res.json();
  },

  async getRefinanceOptions(dealId: number, gameRunId: number): Promise<RefinanceOptions> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/refinance-options?gameRunId=${gameRunId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to get refinance options');
    }
    return res.json();
  },

  async refinanceRental(dealId: number, gameRunId: number, selectedLtv?: number): Promise<{
    deal: Deal;
    gameRun: GameRun;
    cashOut: number;
    newLoanBalance: number;
    oldLoanBalance: number;
    refinanceFees: number;
    newInterestRate: number;
  }> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/refinance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId, selectedLtv }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to refinance property');
    }
    return res.json();
  },

  async cosmeticUpgrade(dealId: number, gameRunId: number): Promise<{
    success: boolean;
    cost: number;
    rentBoostPct: number;
    saleBoostPct: number;
    message: string;
    contractorDiscount: boolean;
  }> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/cosmetic-upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameRunId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to apply cosmetic upgrade');
    }
    return res.json();
  },

  // Premium Purchases (SKU-based, server-defined amounts)
  async purchaseSku(gameRunId: number, sku: string): Promise<GameRun> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Purchase failed' }));
      throw new Error(err.error || 'Failed to complete purchase');
    }
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

  // Tenants
  async getTenants(gameRunId: number): Promise<Tenant[]> {
    const res = await fetch(`${API_BASE}/game-runs/${gameRunId}/tenants`);
    if (!res.ok) throw new Error('Failed to fetch tenants');
    return res.json();
  },

  async createTenant(dealId: number, data: { name: string; personalityType: string; speechPatterns: string[] }): Promise<Tenant> {
    const res = await fetch(`${API_BASE}/deals/${dealId}/tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create tenant');
    return res.json();
  },

  async generateTenantPortrait(tenantId: number, prompt: string): Promise<Tenant | null> {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}/generate-portrait`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data;
  },

  async updateTenant(tenantId: number, updates: Partial<InsertTenant>): Promise<Tenant> {
    const res = await fetch(`${API_BASE}/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update tenant');
    return res.json();
  },
};
