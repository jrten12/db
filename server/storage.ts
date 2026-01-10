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
  InsertLedgerEntry
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

  // Property methods
  getAllProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  seedProperties(): Promise<void>;
  addNewUrbanProperties(): Promise<void>;

  // Deal methods
  createDeal(deal: InsertDeal): Promise<Deal>;
  getDealsByGameRun(gameRunId: number): Promise<Deal[]>;
  updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined>;

  // Property Investigation methods
  createPropertyInvestigation(investigation: InsertPropertyInvestigation): Promise<PropertyInvestigation>;
  getPropertyInvestigations(gameRunId: number): Promise<PropertyInvestigation[]>;

  // Ledger methods
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;
  getLedgerByGameRun(gameRunId: number): Promise<LedgerEntry[]>;
  createLedgerEntriesWithCashUpdate(gameRunId: number, entries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[], currentCash: number): Promise<{ entries: LedgerEntry[], newCash: number }>;
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

  async getDealsByGameRun(gameRunId: number): Promise<Deal[]> {
    return await db
      .select()
      .from(schema.deals)
      .where(eq(schema.deals.gameRunId, gameRunId));
  }

  async updateDeal(id: number, updates: Partial<InsertDeal>): Promise<Deal | undefined> {
    const [deal] = await db
      .update(schema.deals)
      .set(updates)
      .where(eq(schema.deals.id, id))
      .returning();
    return deal;
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
    let runningBalance = currentCash;
    const createdEntries: LedgerEntry[] = [];

    for (const entry of entries) {
      if (entry.direction === 'debit') {
        runningBalance -= entry.amount;
      } else {
        runningBalance += entry.amount;
      }

      const [ledgerEntry] = await db
        .insert(schema.ledgerEntries)
        .values({
          ...entry,
          gameRunId,
          balanceAfter: runningBalance,
        })
        .returning();
      createdEntries.push(ledgerEntry);
    }

    await db
      .update(schema.gameRuns)
      .set({ cash: runningBalance, updatedAt: new Date() })
      .where(eq(schema.gameRuns.id, gameRunId));

    return { entries: createdEntries, newCash: runningBalance };
  }
}

export const storage = new DBStorage();
