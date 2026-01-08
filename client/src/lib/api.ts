import type { GameRun, Property, Deal, InsertGameRun, InsertDeal, PropertyInvestigation, InsertPropertyInvestigation } from '@shared/schema';

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
};
