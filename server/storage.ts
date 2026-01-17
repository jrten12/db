import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  GameRun, 
  InsertGameRun,
  Property,
  InsertProperty,
  Deal,
  InsertDeal,
  PropertyInvestigation,
  InsertPropertyInvestigation,
  LedgerEntry,
  InsertLedgerEntry,
  HallOfFamePlayer,
  InsertHallOfFamePlayer,
  PlayerTrophy,
  InsertPlayerTrophy
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Game Run methods
  createGameRun(gameRun: InsertGameRun): Promise<GameRun>;
  getGameRun(id: number): Promise<GameRun | undefined>;
  updateGameRun(id: number, updates: Partial<InsertGameRun>): Promise<GameRun | undefined>;
  getActiveGameRun(): Promise<GameRun | undefined>;
  getActiveGameByPlayer(playerName: string): Promise<GameRun | undefined>;
  deleteGameRun(id: number): Promise<void>;

  // Property methods
  getAllProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  seedProperties(): Promise<void>;
  updatePropertyLocationTypes(): Promise<void>;
  addNewUrbanProperties(): Promise<void>;

  // Deal methods
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDeal(id: number): Promise<Deal | undefined>;
  getDealsByGameRun(gameRunId: number): Promise<Deal[]>;
  getDealsByPlayerName(playerName: string): Promise<Deal[]>;
  updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined>;
  sellRentalProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number }>;
  sellFlipProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number }>;

  // Property Investigation methods
  createPropertyInvestigation(investigation: InsertPropertyInvestigation): Promise<PropertyInvestigation>;
  getPropertyInvestigations(gameRunId: number): Promise<PropertyInvestigation[]>;

  // Ledger methods
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  getLedgerByGameRun(gameRunId: number): Promise<LedgerEntry[]>;
  createLedgerEntriesWithCashUpdate(gameRunId: number, entries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[], currentCash: number): Promise<{ entries: LedgerEntry[], newCash: number }>;

  // Hall of Fame methods
  getOrCreatePlayer(playerName: string): Promise<HallOfFamePlayer>;
  getAllPlayers(): Promise<HallOfFamePlayer[]>;
  updatePlayerStats(playerId: number, updates: Partial<InsertHallOfFamePlayer>): Promise<HallOfFamePlayer | undefined>;
  awardTrophy(playerId: number, trophyId: string, gameRunId?: number): Promise<PlayerTrophy>;
  getPlayerTrophies(playerId: number): Promise<PlayerTrophy[]>;
  getAllTrophies(): Promise<PlayerTrophy[]>;
  hasPlayerTrophy(playerId: number, trophyId: string): Promise<boolean>;
}

export class DBStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Game Run methods
  async createGameRun(gameRun: InsertGameRun): Promise<GameRun> {
    const [run] = await db
      .insert(schema.gameRuns)
      .values(gameRun)
      .returning();
    return run;
  }

  async getGameRun(id: number): Promise<GameRun | undefined> {
    const [run] = await db
      .select()
      .from(schema.gameRuns)
      .where(eq(schema.gameRuns.id, id))
      .limit(1);
    return run;
  }

  async updateGameRun(id: number, updates: Partial<InsertGameRun>): Promise<GameRun | undefined> {
    const [run] = await db
      .update(schema.gameRuns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.gameRuns.id, id))
      .returning();
    return run;
  }

  async getActiveGameRun(): Promise<GameRun | undefined> {
    const [run] = await db
      .select()
      .from(schema.gameRuns)
      .where(eq(schema.gameRuns.status, "active"))
      .orderBy(desc(schema.gameRuns.createdAt))
      .limit(1);
    return run;
  }

  async getActiveGameByPlayer(playerName: string): Promise<GameRun | undefined> {
    const [run] = await db
      .select()
      .from(schema.gameRuns)
      .where(
        and(
          eq(schema.gameRuns.playerName, playerName),
          eq(schema.gameRuns.status, "active")
        )
      )
      .orderBy(desc(schema.gameRuns.createdAt))
      .limit(1);
    return run;
  }

  async deleteGameRun(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(schema.curveballEvents).where(eq(schema.curveballEvents.gameRunId, id));
      await tx.delete(schema.deals).where(eq(schema.deals.gameRunId, id));
      await tx.delete(schema.propertyInvestigations).where(eq(schema.propertyInvestigations.gameRunId, id));
      await tx.delete(schema.ledgerEntries).where(eq(schema.ledgerEntries.gameRunId, id));
      await tx.delete(schema.gameRuns).where(eq(schema.gameRuns.id, id));
    });
  }

  // Property methods
  async getAllProperties(): Promise<Property[]> {
    return await db
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.isActive, true));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.id, id))
      .limit(1);
    return property;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [prop] = await db
      .insert(schema.properties)
      .values(property)
      .returning();
    return prop;
  }

  async seedProperties(): Promise<void> {
    const count = await db.select().from(schema.properties);
    if (count.length > 0) return;

    const starterProperties: InsertProperty[] = [
      {
        name: "Oakwood Cottage",
        price: 145000,
        sizeSqft: 1200,
        neighborhood: "Oakwood",
        rentMin: 1300,
        rentMax: 1600,
        arvMin: 160000,
        arvMax: 180000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 5000,
        rehabMax: 12000,
        timelineMin: 2,
        timelineMax: 4,
        offMarketRate: 0.1,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Riverside Ranch",
        price: 195000,
        sizeSqft: 1600,
        neighborhood: "Riverside",
        rentMin: 1700,
        rentMax: 2000,
        arvMin: 240000,
        arvMax: 280000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 35000,
        rehabMax: 55000,
        timelineMin: 8,
        timelineMax: 14,
        offMarketRate: 0.12,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Maplewood Colonial",
        price: 185000,
        sizeSqft: 1450,
        neighborhood: "Maplewood",
        rentMin: 1400,
        rentMax: 1800,
        arvMin: 220000,
        arvMax: 260000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 30000,
        rehabMax: 55000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.15,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Downtown Loft",
        price: 220000,
        sizeSqft: 1800,
        neighborhood: "Downtown",
        rentMin: 2200,
        rentMax: 2600,
        arvMin: 250000,
        arvMax: 290000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 8000,
        rehabMax: 15000,
        timelineMin: 2,
        timelineMax: 4,
        offMarketRate: 0.25,
        viabilityProfile: "rent-mirage",
        isActive: true,
      },
      {
        name: "Elmwood Bungalow",
        price: 125000,
        sizeSqft: 1350,
        neighborhood: "Elmwood",
        rentMin: 1200,
        rentMax: 1500,
        arvMin: 180000,
        arvMax: 210000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 45000,
        rehabMax: 85000,
        timelineMin: 10,
        timelineMax: 20,
        offMarketRate: 0.08,
        viabilityProfile: "rehab-sinkhole",
        isActive: true,
      },
      {
        name: "Hillside Retreat",
        price: 165000,
        sizeSqft: 1500,
        neighborhood: "Hillside",
        rentMin: 1500,
        rentMax: 1800,
        arvMin: 200000,
        arvMax: 235000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 25000,
        rehabMax: 45000,
        timelineMin: 12,
        timelineMax: 24,
        offMarketRate: 0.18,
        viabilityProfile: "time-bomb",
        isActive: true,
      },
      {
        name: "Westside Manor",
        price: 275000,
        sizeSqft: 2000,
        neighborhood: "Westside",
        rentMin: 2400,
        rentMax: 2800,
        arvMin: 320000,
        arvMax: 360000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 40000,
        rehabMax: 65000,
        timelineMin: 8,
        timelineMax: 14,
        offMarketRate: 0.22,
        viabilityProfile: "leverage-trap",
        isActive: true,
      },
      {
        name: "South Street Twin",
        price: 165000,
        sizeSqft: 1400,
        neighborhood: "South Street",
        rentMin: 1450,
        rentMax: 1750,
        arvMin: 200000,
        arvMax: 230000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 20000,
        rehabMax: 35000,
        timelineMin: 5,
        timelineMax: 10,
        offMarketRate: 0.16,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Fishtown Row House",
        price: 195000,
        sizeSqft: 1500,
        neighborhood: "Fishtown",
        rentMin: 1800,
        rentMax: 2100,
        arvMin: 245000,
        arvMax: 280000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 15000,
        rehabMax: 28000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.20,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Port Richmond Duplex",
        price: 235000,
        sizeSqft: 2200,
        neighborhood: "Port Richmond",
        rentMin: 2400,
        rentMax: 2800,
        arvMin: 280000,
        arvMax: 320000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 30000,
        rehabMax: 50000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.18,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Kensington Row",
        price: 145000,
        sizeSqft: 1350,
        neighborhood: "Kensington",
        rentMin: 1350,
        rentMax: 1650,
        arvMin: 195000,
        arvMax: 225000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 35000,
        rehabMax: 60000,
        timelineMin: 8,
        timelineMax: 16,
        offMarketRate: 0.14,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Northern Liberties Loft",
        price: 285000,
        sizeSqft: 1800,
        neighborhood: "Northern Liberties",
        rentMin: 2500,
        rentMax: 2900,
        arvMin: 330000,
        arvMax: 370000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 10000,
        rehabMax: 20000,
        timelineMin: 3,
        timelineMax: 6,
        offMarketRate: 0.28,
        viabilityProfile: "viable",
        isActive: true,
      },
    ];

    await db.insert(schema.properties).values(starterProperties);
  }

  async updatePropertyLocationTypes(): Promise<void> {
    const urbanNeighborhoods = [
      "Downtown", "Northern Liberties", "Fishtown", "South Street", 
      "Kensington", "Port Richmond", "Old City", "Center City",
      "Rittenhouse Square", "Society Hill", "Queen Village", 
      "Graduate Hospital", "Fairmount"
    ];
    
    const allProperties = await db.select().from(schema.properties);
    
    for (const prop of allProperties) {
      const isUrban = urbanNeighborhoods.some(n => 
        prop.neighborhood.toLowerCase().includes(n.toLowerCase())
      );
      const correctLocationType = isUrban ? "urban" : "suburban";
      
      if (prop.locationType !== correctLocationType) {
        await db
          .update(schema.properties)
          .set({ locationType: correctLocationType })
          .where(eq(schema.properties.id, prop.id));
        console.log(`Updated ${prop.name} to ${correctLocationType}`);
      }
    }
  }

  async addNewUrbanProperties(): Promise<void> {
    const newUrbanProperties: InsertProperty[] = [
      {
        name: "South Street Twin",
        price: 165000,
        sizeSqft: 1400,
        neighborhood: "South Street",
        rentMin: 1450,
        rentMax: 1750,
        arvMin: 200000,
        arvMax: 230000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 20000,
        rehabMax: 35000,
        timelineMin: 5,
        timelineMax: 10,
        offMarketRate: 0.16,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Fishtown Row House",
        price: 195000,
        sizeSqft: 1500,
        neighborhood: "Fishtown",
        rentMin: 1800,
        rentMax: 2100,
        arvMin: 245000,
        arvMax: 280000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 15000,
        rehabMax: 28000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.20,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Port Richmond Duplex",
        price: 235000,
        sizeSqft: 2200,
        neighborhood: "Port Richmond",
        rentMin: 2400,
        rentMax: 2800,
        arvMin: 280000,
        arvMax: 320000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 30000,
        rehabMax: 50000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.18,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Kensington Row",
        price: 145000,
        sizeSqft: 1350,
        neighborhood: "Kensington",
        rentMin: 1350,
        rentMax: 1650,
        arvMin: 195000,
        arvMax: 225000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 35000,
        rehabMax: 60000,
        timelineMin: 8,
        timelineMax: 16,
        offMarketRate: 0.14,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Northern Liberties Loft",
        price: 285000,
        sizeSqft: 1800,
        neighborhood: "Northern Liberties",
        rentMin: 2500,
        rentMax: 2900,
        arvMin: 330000,
        arvMax: 370000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 10000,
        rehabMax: 20000,
        timelineMin: 3,
        timelineMax: 6,
        offMarketRate: 0.28,
        viabilityProfile: "viable",
        isActive: true,
      },
    ];

    // Check which properties don't exist yet and insert only those
    for (const prop of newUrbanProperties) {
      const existing = await db
        .select()
        .from(schema.properties)
        .where(eq(schema.properties.name, prop.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.properties).values(prop);
        console.log(`Added new property: ${prop.name}`);
      }
    }
  }

  // Deal methods
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db
      .insert(schema.deals)
      .values(deal)
      .returning();
    return newDeal;
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    const [deal] = await db
      .select()
      .from(schema.deals)
      .where(eq(schema.deals.id, id))
      .limit(1);
    return deal;
  }

  async getDealsByGameRun(gameRunId: number): Promise<Deal[]> {
    return await db
      .select()
      .from(schema.deals)
      .where(eq(schema.deals.gameRunId, gameRunId));
  }

  async getDealsByPlayerName(playerName: string): Promise<Deal[]> {
    const playerGameRuns = await db
      .select({ id: schema.gameRuns.id })
      .from(schema.gameRuns)
      .where(eq(schema.gameRuns.playerName, playerName));
    
    if (playerGameRuns.length === 0) return [];
    
    const gameRunIds = playerGameRuns.map(gr => gr.id);
    const allDeals: Deal[] = [];
    for (const gameRunId of gameRunIds) {
      const deals = await db
        .select()
        .from(schema.deals)
        .where(eq(schema.deals.gameRunId, gameRunId));
      allDeals.push(...deals);
    }
    return allDeals;
  }

  async updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(schema.deals)
      .set(updates)
      .where(eq(schema.deals.id, id))
      .returning();
    return deal;
  }

  async sellRentalProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number }> {
    const [deal] = await db
      .select()
      .from(schema.deals)
      .where(and(eq(schema.deals.id, dealId), eq(schema.deals.gameRunId, gameRunId)))
      .limit(1);
    
    if (!deal) {
      throw new Error('Deal not found');
    }
    
    if (deal.status !== 'active_rental') {
      throw new Error('Can only sell active rental properties');
    }
    
    const [gameRun] = await db
      .select()
      .from(schema.gameRuns)
      .where(eq(schema.gameRuns.id, gameRunId))
      .limit(1);
    
    if (!gameRun) {
      throw new Error('Game run not found');
    }
    
    if (gameRun.weeksRemaining < 2) {
      throw new Error('Not enough weeks remaining to sell (need 2 weeks)');
    }
    
    let purchasePrice = deal.purchasePrice ?? 0;
    if (purchasePrice <= 0) {
      const [property] = await db
        .select()
        .from(schema.properties)
        .where(eq(schema.properties.id, deal.propertyId))
        .limit(1);
      if (!property) throw new Error('Property not found');
      purchasePrice = property.price;
    }
    
    // Rental sale: -15% to +10% of purchase price (less upside due to wear and tear)
    const saleMultiplier = 0.85 + Math.random() * 0.25;
    const salePrice = Math.round(purchasePrice * saleMultiplier);
    const saleProfit = salePrice - purchasePrice;
    
    const [updatedDeal] = await db
      .update(schema.deals)
      .set({
        status: 'sold_rental',
        salePrice,
        saleMultiplier,
        purchasePrice,
        weeklyIncome: 0,
        completedAt: new Date(),
      })
      .where(eq(schema.deals.id, dealId))
      .returning();
    
    const newWeeksRemaining = gameRun.weeksRemaining - 2;
    const newCash = gameRun.cash + salePrice;
    const isProfitable = saleProfit > 0;
    const newProfitableDeals = isProfitable ? gameRun.profitableDeals + 1 : gameRun.profitableDeals;
    
    const [updatedGameRun] = await db
      .update(schema.gameRuns)
      .set({
        weeksRemaining: newWeeksRemaining,
        cash: newCash,
        profitableDeals: newProfitableDeals,
        updatedAt: new Date(),
      })
      .where(eq(schema.gameRuns.id, gameRunId))
      .returning();
    
    await db.insert(schema.ledgerEntries).values({
      gameRunId,
      direction: 'credit',
      category: 'sale_proceeds',
      amount: salePrice,
      balanceAfter: newCash,
      description: `Sold rental property - ${saleMultiplier >= 1 ? '+' : ''}${Math.round((saleMultiplier - 1) * 100)}% of purchase price`,
      propertyId: deal.propertyId,
      dealId: dealId,
    });
    
    return {
      deal: updatedDeal,
      gameRun: updatedGameRun,
      saleProfit,
      salePrice,
      purchasePrice,
    };
  }

  async sellFlipProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number }> {
    const [deal] = await db
      .select()
      .from(schema.deals)
      .where(and(eq(schema.deals.id, dealId), eq(schema.deals.gameRunId, gameRunId)))
      .limit(1);
    
    if (!deal) {
      throw new Error('Deal not found');
    }
    
    if (deal.status !== 'ready_to_list') {
      throw new Error('Can only sell properties that are ready to list');
    }
    
    const [gameRun] = await db
      .select()
      .from(schema.gameRuns)
      .where(eq(schema.gameRuns.id, gameRunId))
      .limit(1);
    
    if (!gameRun) {
      throw new Error('Game run not found');
    }
    
    if (gameRun.weeksRemaining < 2) {
      throw new Error('Not enough weeks remaining to sell (need 2 weeks)');
    }
    
    // Get purchase price from deal or property
    let purchasePrice = deal.purchasePrice ?? 0;
    if (purchasePrice <= 0) {
      const [property] = await db
        .select()
        .from(schema.properties)
        .where(eq(schema.properties.id, deal.propertyId))
        .limit(1);
      if (!property) throw new Error('Property not found');
      purchasePrice = property.price;
    }
    
    // Flip sale: -10% to +15% of purchase price
    const saleMultiplier = 0.90 + Math.random() * 0.25;
    const salePrice = Math.round(purchasePrice * saleMultiplier);
    const saleProfit = salePrice - purchasePrice;
    
    const [updatedDeal] = await db
      .update(schema.deals)
      .set({
        status: 'completed',
        salePrice,
        saleMultiplier,
        purchasePrice,
        actualProfit: saleProfit,
        completedAt: new Date(),
      })
      .where(eq(schema.deals.id, dealId))
      .returning();
    
    // Deduct 2 weeks for sale process
    const newWeeksRemaining = gameRun.weeksRemaining - 2;
    const newCash = gameRun.cash + salePrice;
    const isProfitable = saleProfit > 0;
    const newProfitableDeals = isProfitable ? gameRun.profitableDeals + 1 : gameRun.profitableDeals;
    
    const [updatedGameRun] = await db
      .update(schema.gameRuns)
      .set({
        weeksRemaining: newWeeksRemaining,
        cash: newCash,
        profitableDeals: newProfitableDeals,
        updatedAt: new Date(),
      })
      .where(eq(schema.gameRuns.id, gameRunId))
      .returning();
    
    // Add ledger entry for sale proceeds
    await db.insert(schema.ledgerEntries).values({
      gameRunId,
      direction: 'credit',
      category: 'sale_proceeds',
      amount: salePrice,
      balanceAfter: newCash,
      description: `Sold flip property - ${saleMultiplier >= 1 ? '+' : ''}${Math.round((saleMultiplier - 1) * 100)}% of purchase price`,
      propertyId: deal.propertyId,
      dealId: dealId,
    });
    
    return {
      deal: updatedDeal,
      gameRun: updatedGameRun,
      saleProfit,
      salePrice,
      purchasePrice,
    };
  }

  // Property Investigation methods
  async createPropertyInvestigation(investigation: InsertPropertyInvestigation): Promise<PropertyInvestigation> {
    const [inv] = await db
      .insert(schema.propertyInvestigations)
      .values(investigation)
      .returning();
    return inv;
  }

  async getPropertyInvestigations(gameRunId: number): Promise<PropertyInvestigation[]> {
    return await db
      .select()
      .from(schema.propertyInvestigations)
      .where(eq(schema.propertyInvestigations.gameRunId, gameRunId));
  }

  // Ledger methods
  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const [ledgerEntry] = await db
      .insert(schema.ledgerEntries)
      .values(entry)
      .returning();
    return ledgerEntry;
  }

  async getLedgerByGameRun(gameRunId: number): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.gameRunId, gameRunId))
      .orderBy(desc(schema.ledgerEntries.createdAt));
  }

  async createLedgerEntriesWithCashUpdate(
    gameRunId: number, 
    entries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[], 
    currentCash: number
  ): Promise<{ entries: LedgerEntry[], newCash: number }> {
    return await db.transaction(async (tx) => {
      let runningBalance = currentCash;
      const createdEntries: LedgerEntry[] = [];

      for (const entry of entries) {
        if (entry.direction === 'debit') {
          runningBalance -= entry.amount;
        } else {
          runningBalance += entry.amount;
        }

        const [ledgerEntry] = await tx
          .insert(schema.ledgerEntries)
          .values({
            ...entry,
            gameRunId,
            balanceAfter: runningBalance,
          })
          .returning();
        createdEntries.push(ledgerEntry);
      }

      await tx
        .update(schema.gameRuns)
        .set({ cash: runningBalance, updatedAt: new Date() })
        .where(eq(schema.gameRuns.id, gameRunId));

      return { entries: createdEntries, newCash: runningBalance };
    });
  }

  // Restore methods for save game feature
  async restoreGameRunData(
    gameRunId: number,
    savedDeals: Array<Omit<InsertDeal, 'gameRunId'>>,
    savedInvestigations: Array<Omit<InsertPropertyInvestigation, 'gameRunId'>>,
    savedLedgerEntries: Array<Omit<InsertLedgerEntry, 'gameRunId'>>
  ): Promise<{ deals: Deal[]; investigations: PropertyInvestigation[]; ledgerEntries: LedgerEntry[] }> {
    return await db.transaction(async (tx) => {
      const restoredDeals: Deal[] = [];
      const restoredInvestigations: PropertyInvestigation[] = [];
      const restoredLedgerEntries: LedgerEntry[] = [];

      // Restore investigations first
      for (const inv of savedInvestigations) {
        const [restored] = await tx
          .insert(schema.propertyInvestigations)
          .values({ ...inv, gameRunId })
          .returning();
        restoredInvestigations.push(restored);
      }

      // Restore deals
      for (const deal of savedDeals) {
        const [restored] = await tx
          .insert(schema.deals)
          .values({ ...deal, gameRunId })
          .returning();
        restoredDeals.push(restored);
      }

      // Restore ledger entries (without updating cash since game run already has correct cash)
      for (const entry of savedLedgerEntries) {
        const [restored] = await tx
          .insert(schema.ledgerEntries)
          .values({ ...entry, gameRunId })
          .returning();
        restoredLedgerEntries.push(restored);
      }

      return { deals: restoredDeals, investigations: restoredInvestigations, ledgerEntries: restoredLedgerEntries };
    });
  }

  // Hall of Fame methods
  async getOrCreatePlayer(playerName: string): Promise<HallOfFamePlayer> {
    const [existing] = await db
      .select()
      .from(schema.hallOfFamePlayers)
      .where(eq(schema.hallOfFamePlayers.playerName, playerName))
      .limit(1);

    if (existing) {
      await db
        .update(schema.hallOfFamePlayers)
        .set({ lastPlayedAt: new Date() })
        .where(eq(schema.hallOfFamePlayers.id, existing.id));
      return existing;
    }

    const [player] = await db
      .insert(schema.hallOfFamePlayers)
      .values({ playerName })
      .returning();
    return player;
  }

  async getAllPlayers(): Promise<HallOfFamePlayer[]> {
    return await db
      .select()
      .from(schema.hallOfFamePlayers)
      .orderBy(desc(schema.hallOfFamePlayers.totalProfitEarned));
  }

  async updatePlayerStats(playerId: number, updates: Partial<InsertHallOfFamePlayer>): Promise<HallOfFamePlayer | undefined> {
    const [player] = await db
      .update(schema.hallOfFamePlayers)
      .set({ ...updates, lastPlayedAt: new Date() })
      .where(eq(schema.hallOfFamePlayers.id, playerId))
      .returning();
    return player;
  }

  async awardTrophy(playerId: number, trophyId: string, gameRunId?: number): Promise<PlayerTrophy> {
    const [trophy] = await db
      .insert(schema.playerTrophies)
      .values({ playerId, trophyId, gameRunId: gameRunId || null })
      .returning();
    return trophy;
  }

  async getPlayerTrophies(playerId: number): Promise<PlayerTrophy[]> {
    return await db
      .select()
      .from(schema.playerTrophies)
      .where(eq(schema.playerTrophies.playerId, playerId));
  }

  async getAllTrophies(): Promise<PlayerTrophy[]> {
    return await db
      .select()
      .from(schema.playerTrophies);
  }

  async hasPlayerTrophy(playerId: number, trophyId: string): Promise<boolean> {
    const [trophy] = await db
      .select()
      .from(schema.playerTrophies)
      .where(and(
        eq(schema.playerTrophies.playerId, playerId),
        eq(schema.playerTrophies.trophyId, trophyId)
      ))
      .limit(1);
    return !!trophy;
  }
}

export const storage = new DBStorage();
