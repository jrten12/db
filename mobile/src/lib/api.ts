import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://dealbreaksimulator.com';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface GameRun {
  id: number;
  playerName: string;
  difficulty: string;
  cash: number;
  weeksRemaining: number;
  currentWeek: number;
  profitableDeals: number;
  goalDeals: number;
  status: string;
  marketCondition: string;
  lastMarketChangeWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: number;
  name: string;
  price: number;
  sizeSqft: number;
  neighborhood: string;
  rentMin: number;
  rentMax: number;
  postRehabRentMin: number | null;
  postRehabRentMax: number | null;
  arvMin: number;
  arvMax: number;
  conditionTag: string;
  photoUrl: string | null;
  rehabMin: number;
  rehabMax: number;
  timelineMin: number;
  timelineMax: number;
  locationType: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  waterSource: string;
  heatType: string;
}

export interface Deal {
  id: number;
  gameRunId: number;
  propertyId: number;
  strategy: string;
  proFormaInputs: any;
  proFormaOutputs: any;
  actualProfit: number | null;
  status: string;
  weeksSpent: number | null;
  weeksUntilCompletion: number | null;
  weeklyIncome: number | null;
  purchasePrice: number | null;
  salePrice: number | null;
  originalLoanAmount: number | null;
  loanInterestRate: number | null;
  currentLoanBalance: number | null;
  refinanceCount: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface Investigation {
  id: number;
  gameRunId: number;
  propertyId: number;
  investigationType: string;
  revealedData: any;
  cost: number;
  weeksUsed: number;
  completedAt: string;
}

export interface LedgerEntry {
  id: number;
  gameRunId: number;
  category: string;
  description: string;
  amount: number;
  week: number;
  createdAt: string;
}

export interface Tenant {
  id: number;
  dealId: number;
  gameRunId: number;
  name: string;
  personalityType: string;
  portraitUrl: string | null;
}

export const api = {
  getActiveGameRun: () =>
    request<GameRun | null>('/api/game-runs/active'),

  getGameRun: (id: number) =>
    request<GameRun>(`/api/game-runs/${id}`),

  getGameByPlayer: (playerName: string) =>
    request<GameRun | null>(`/api/game-runs/player/${encodeURIComponent(playerName)}`),

  createGameRun: (data: { playerName: string; difficulty?: string }) =>
    request<GameRun>('/api/game-runs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGameRun: (id: number, updates: Partial<GameRun>) =>
    request<GameRun>(`/api/game-runs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteGameRun: (id: number) =>
    request<{ success: boolean }>(`/api/game-runs/${id}`, {
      method: 'DELETE',
    }),

  endGameRun: (id: number, data: { playerName: string }) =>
    request<any>(`/api/game-runs/${id}/end`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  advanceWeek: (gameRunId: number) =>
    request<any>(`/api/game-runs/${gameRunId}/advance-week`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  getProperties: () =>
    request<Property[]>('/api/properties'),

  getDeals: (gameRunId: number) =>
    request<Deal[]>(`/api/game-runs/${gameRunId}/deals`),

  createDeal: (data: any) =>
    request<Deal>('/api/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  startRehab: (dealId: number, data: { gameRunId: number; rehabWeeks: number }) =>
    request<Deal>(`/api/deals/${dealId}/start-rehab`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completeFlip: (dealId: number, data: { gameRunId: number }) =>
    request<any>(`/api/deals/${dealId}/complete-flip`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  activateRental: (dealId: number, data: { gameRunId: number }) =>
    request<any>(`/api/deals/${dealId}/activate-rental`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sellRental: (dealId: number, data: { gameRunId: number }) =>
    request<any>(`/api/deals/${dealId}/sell`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sellFlip: (dealId: number, data: { gameRunId: number }) =>
    request<any>(`/api/deals/${dealId}/sell-flip`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createInvestigation: (data: {
    gameRunId: number;
    propertyId: number;
    investigationType: string;
    cost: number;
    weeksUsed: number;
  }) =>
    request<Investigation>('/api/investigations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getInvestigations: (gameRunId: number) =>
    request<Investigation[]>(`/api/game-runs/${gameRunId}/investigations`),

  getLedger: (gameRunId: number) =>
    request<LedgerEntry[]>(`/api/game-runs/${gameRunId}/ledger`),

  getTenants: (gameRunId: number) =>
    request<Tenant[]>(`/api/game-runs/${gameRunId}/tenants`),

  getHallOfFame: () =>
    request<any[]>('/api/hall-of-fame'),

  createPlayer: (data: { playerName: string }) =>
    request<any>('/api/players', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAchievements: (gameRunId: number) =>
    request<any[]>(`/api/game-runs/${gameRunId}/achievements`),
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

export const MARKET_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  terrible: { label: 'Terrible', color: '#ef4444', icon: 'trending-down' },
  poor: { label: 'Poor', color: '#f97316', icon: 'arrow-down' },
  neutral: { label: 'Neutral', color: '#eab308', icon: 'remove' },
  good: { label: 'Good', color: '#22c55e', icon: 'arrow-up' },
  excellent: { label: 'Excellent', color: '#10b981', icon: 'trending-up' },
};
