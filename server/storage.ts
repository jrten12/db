import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { MarketCondition } from "@shared/schema";
import { getMarketMultipliers } from "./gameMechanics";
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
  InsertPlayerTrophy,
  Tenant,
  InsertTenant,
  Coupon,
  InsertCoupon,
  CouponRedemption
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
  sellRentalProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number; mortgagePayoff: number; netProceeds: number }>;
  sellFlipProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number; netProceeds: number; mortgagePayoff: number }>;
  refinanceRentalProperty(dealId: number, gameRunId: number, requestedCashOut?: number, selectedLtv?: number, allDeals?: Deal[], property?: Property): Promise<{ deal: Deal; gameRun: GameRun; cashOut: number; newLoanBalance: number; oldLoanBalance: number; refinanceFees: number; newInterestRate: number }>;

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

  // Tenant methods
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenantByDeal(dealId: number): Promise<Tenant | undefined>;
  getTenantsByGameRun(gameRunId: number): Promise<Tenant[]>;
  updateTenant(id: number, updates: Partial<InsertTenant>): Promise<Tenant | undefined>;
  
  // Curveball methods
  getLastCurveballForDeal(dealId: number): Promise<string | undefined>;

  // Coupon methods
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getAllCoupons(): Promise<Coupon[]>;
  updateCoupon(id: number, updates: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  redeemCoupon(couponId: number, gameRunId: number): Promise<{ coupon: Coupon; gameRun: GameRun; cashAdded: number; monthsAdded: number }>;
  hasRedeemedCoupon(couponId: number, gameRunId: number): Promise<boolean>;
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
        price: 218000,
        sizeSqft: 1200,
        neighborhood: "Oakwood",
        rentMin: 1950,
        rentMax: 2400,
        arvMin: 240000,
        arvMax: 270000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 7000,
        rehabMax: 17000,
        timelineMin: 2,
        timelineMax: 4,
        offMarketRate: 0.1,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Riverside Ranch",
        price: 293000,
        sizeSqft: 1600,
        neighborhood: "Riverside",
        rentMin: 2550,
        rentMax: 3000,
        arvMin: 360000,
        arvMax: 420000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 49000,
        rehabMax: 77000,
        timelineMin: 8,
        timelineMax: 14,
        offMarketRate: 0.12,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Maplewood Colonial",
        price: 278000,
        sizeSqft: 1450,
        neighborhood: "Maplewood",
        rentMin: 2100,
        rentMax: 2700,
        arvMin: 330000,
        arvMax: 390000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 42000,
        rehabMax: 77000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.15,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Downtown Loft",
        price: 330000,
        sizeSqft: 1800,
        neighborhood: "Downtown",
        rentMin: 3300,
        rentMax: 3900,
        arvMin: 375000,
        arvMax: 435000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 11000,
        rehabMax: 21000,
        timelineMin: 2,
        timelineMax: 4,
        offMarketRate: 0.25,
        viabilityProfile: "rent-mirage",
        isActive: true,
      },
      {
        name: "Elmwood Bungalow",
        price: 188000,
        sizeSqft: 1350,
        neighborhood: "Elmwood",
        rentMin: 1800,
        rentMax: 2250,
        arvMin: 270000,
        arvMax: 315000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 63000,
        rehabMax: 119000,
        timelineMin: 10,
        timelineMax: 20,
        offMarketRate: 0.08,
        viabilityProfile: "rehab-sinkhole",
        isActive: true,
      },
      {
        name: "Hillside Retreat",
        price: 248000,
        sizeSqft: 1500,
        neighborhood: "Hillside",
        rentMin: 2250,
        rentMax: 2700,
        arvMin: 300000,
        arvMax: 353000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 35000,
        rehabMax: 63000,
        timelineMin: 12,
        timelineMax: 24,
        offMarketRate: 0.18,
        viabilityProfile: "time-bomb",
        isActive: true,
      },
      {
        name: "Westside Manor",
        price: 413000,
        sizeSqft: 2000,
        neighborhood: "Westside",
        rentMin: 3600,
        rentMax: 4200,
        arvMin: 480000,
        arvMax: 540000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 56000,
        rehabMax: 91000,
        timelineMin: 8,
        timelineMax: 14,
        offMarketRate: 0.22,
        viabilityProfile: "leverage-trap",
        isActive: true,
      },
      {
        name: "South Street Twin",
        price: 248000,
        sizeSqft: 1400,
        neighborhood: "South Street",
        rentMin: 2175,
        rentMax: 2625,
        arvMin: 300000,
        arvMax: 345000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 28000,
        rehabMax: 49000,
        timelineMin: 5,
        timelineMax: 10,
        offMarketRate: 0.16,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Fishtown Row House",
        price: 293000,
        sizeSqft: 1500,
        neighborhood: "Fishtown",
        rentMin: 2700,
        rentMax: 3150,
        arvMin: 368000,
        arvMax: 420000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 21000,
        rehabMax: 39000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.20,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Port Richmond Duplex",
        price: 353000,
        sizeSqft: 2200,
        neighborhood: "Port Richmond",
        rentMin: 3600,
        rentMax: 4200,
        arvMin: 420000,
        arvMax: 480000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 42000,
        rehabMax: 70000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.18,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Kensington Row",
        price: 218000,
        sizeSqft: 1350,
        neighborhood: "Kensington",
        rentMin: 2025,
        rentMax: 2475,
        arvMin: 293000,
        arvMax: 338000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 49000,
        rehabMax: 84000,
        timelineMin: 8,
        timelineMax: 16,
        offMarketRate: 0.14,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Northern Liberties Loft",
        price: 428000,
        sizeSqft: 1800,
        neighborhood: "Northern Liberties",
        rentMin: 3750,
        rentMax: 4350,
        arvMin: 495000,
        arvMax: 555000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 14000,
        rehabMax: 28000,
        timelineMin: 3,
        timelineMax: 6,
        offMarketRate: 0.28,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Hudson Valley Farmhouse",
        price: 728000,
        sizeSqft: 2800,
        neighborhood: "Hudson Valley",
        rentMin: 5700,
        rentMax: 6750,
        arvMin: 870000,
        arvMax: 990000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 35000,
        rehabMax: 63000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.10,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "suburban",
        propertyType: "house",
      },
      {
        name: "Skyline Penthouse",
        price: 938000,
        sizeSqft: 2200,
        neighborhood: "Center City",
        rentMin: 8250,
        rentMax: 9750,
        arvMin: 1080000,
        arvMax: 1230000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 21000,
        rehabMax: 42000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.35,
        viabilityProfile: "leverage-trap",
        isActive: true,
        locationType: "urban",
        propertyType: "condo",
      },
      {
        name: "Chestnut Hill Victorian",
        price: 818000,
        sizeSqft: 3200,
        neighborhood: "Chestnut Hill",
        rentMin: 6300,
        rentMax: 7500,
        arvMin: 975000,
        arvMax: 1125000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 77000,
        rehabMax: 133000,
        timelineMin: 12,
        timelineMax: 20,
        offMarketRate: 0.12,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "suburban",
        propertyType: "house",
      },
      {
        name: "Lakefront Estate",
        price: 1088000,
        sizeSqft: 3800,
        neighborhood: "Lake Nockamixon",
        rentMin: 8700,
        rentMax: 10500,
        arvMin: 1275000,
        arvMax: 1470000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 28000,
        rehabMax: 56000,
        timelineMin: 5,
        timelineMax: 10,
        offMarketRate: 0.08,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "suburban",
        propertyType: "house",
      },
      {
        name: "Graduate Hospital Brownstone",
        price: 428000,
        sizeSqft: 1900,
        neighborhood: "Graduate Hospital",
        rentMin: 3900,
        rentMax: 4500,
        arvMin: 510000,
        arvMax: 585000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 31000,
        rehabMax: 53000,
        timelineMin: 5,
        timelineMax: 10,
        offMarketRate: 0.22,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "townhouse",
      },
      {
        name: "Rittenhouse Square Condo",
        price: 593000,
        sizeSqft: 1400,
        neighborhood: "Rittenhouse Square",
        rentMin: 4800,
        rentMax: 5700,
        arvMin: 675000,
        arvMax: 780000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 17000,
        rehabMax: 35000,
        timelineMin: 3,
        timelineMax: 6,
        offMarketRate: 0.30,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "condo",
      },
      {
        name: "Queen Village Rowhouse",
        price: 338000,
        sizeSqft: 1650,
        neighborhood: "Queen Village",
        rentMin: 3150,
        rentMax: 3750,
        arvMin: 413000,
        arvMax: 473000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 39000,
        rehabMax: 67000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.19,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "townhouse",
      },
      {
        name: "Society Hill Colonial",
        price: 713000,
        sizeSqft: 2400,
        neighborhood: "Society Hill",
        rentMin: 5700,
        rentMax: 6600,
        arvMin: 840000,
        arvMax: 960000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 49000,
        rehabMax: 77000,
        timelineMin: 8,
        timelineMax: 14,
        offMarketRate: 0.25,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "house",
      },
      {
        name: "Fairmount Rowhome",
        price: 293000,
        sizeSqft: 1550,
        neighborhood: "Fairmount",
        rentMin: 2625,
        rentMax: 3150,
        arvMin: 360000,
        arvMax: 420000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 45000,
        rehabMax: 73000,
        timelineMin: 7,
        timelineMax: 14,
        offMarketRate: 0.17,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "townhouse",
      },
      {
        name: "Old City Loft",
        price: 518000,
        sizeSqft: 1700,
        neighborhood: "Old City",
        rentMin: 4350,
        rentMax: 5100,
        arvMin: 600000,
        arvMax: 690000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 21000,
        rehabMax: 39000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.28,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "condo",
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
        price: 248000,
        sizeSqft: 1400,
        neighborhood: "South Street",
        rentMin: 2175,
        rentMax: 2625,
        arvMin: 300000,
        arvMax: 345000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 28000,
        rehabMax: 49000,
        timelineMin: 5,
        timelineMax: 10,
        offMarketRate: 0.16,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Fishtown Row House",
        price: 293000,
        sizeSqft: 1500,
        neighborhood: "Fishtown",
        rentMin: 2700,
        rentMax: 3150,
        arvMin: 368000,
        arvMax: 420000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 21000,
        rehabMax: 39000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.20,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Port Richmond Duplex",
        price: 353000,
        sizeSqft: 2200,
        neighborhood: "Port Richmond",
        rentMin: 3600,
        rentMax: 4200,
        arvMin: 420000,
        arvMax: 480000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 42000,
        rehabMax: 70000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.18,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Kensington Row",
        price: 218000,
        sizeSqft: 1350,
        neighborhood: "Kensington",
        rentMin: 2025,
        rentMax: 2475,
        arvMin: 293000,
        arvMax: 338000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 49000,
        rehabMax: 84000,
        timelineMin: 8,
        timelineMax: 16,
        offMarketRate: 0.14,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Northern Liberties Loft",
        price: 428000,
        sizeSqft: 1800,
        neighborhood: "Northern Liberties",
        rentMin: 3750,
        rentMax: 4350,
        arvMin: 495000,
        arvMax: 555000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 14000,
        rehabMax: 28000,
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

  // Update all property prices to the new balanced economy values
  async refreshPropertyPrices(): Promise<{ updated: number; properties: string[] }> {
    const priceUpdates: Record<string, {
      price: number;
      rentMin: number;
      rentMax: number;
      arvMin: number;
      arvMax: number;
      rehabMin: number;
      rehabMax: number;
    }> = {
      "Oakwood Cottage": { price: 218000, rentMin: 1950, rentMax: 2400, arvMin: 240000, arvMax: 270000, rehabMin: 7000, rehabMax: 17000 },
      "Riverside Ranch": { price: 293000, rentMin: 2550, rentMax: 3000, arvMin: 360000, arvMax: 420000, rehabMin: 49000, rehabMax: 77000 },
      "Maplewood Colonial": { price: 278000, rentMin: 2100, rentMax: 2700, arvMin: 330000, arvMax: 390000, rehabMin: 42000, rehabMax: 77000 },
      "Downtown Loft": { price: 330000, rentMin: 3300, rentMax: 3900, arvMin: 375000, arvMax: 435000, rehabMin: 11000, rehabMax: 21000 },
      "Elmwood Bungalow": { price: 188000, rentMin: 1800, rentMax: 2250, arvMin: 270000, arvMax: 315000, rehabMin: 63000, rehabMax: 119000 },
      "Hillside Retreat": { price: 248000, rentMin: 2250, rentMax: 2700, arvMin: 300000, arvMax: 353000, rehabMin: 35000, rehabMax: 63000 },
      "Westside Manor": { price: 413000, rentMin: 3600, rentMax: 4200, arvMin: 480000, arvMax: 540000, rehabMin: 56000, rehabMax: 91000 },
      "South Street Twin": { price: 248000, rentMin: 2175, rentMax: 2625, arvMin: 300000, arvMax: 345000, rehabMin: 28000, rehabMax: 49000 },
      "Fishtown Row House": { price: 293000, rentMin: 2700, rentMax: 3150, arvMin: 368000, arvMax: 420000, rehabMin: 21000, rehabMax: 39000 },
      "Port Richmond Duplex": { price: 353000, rentMin: 3600, rentMax: 4200, arvMin: 420000, arvMax: 480000, rehabMin: 42000, rehabMax: 70000 },
      "Kensington Row": { price: 218000, rentMin: 2025, rentMax: 2475, arvMin: 293000, arvMax: 338000, rehabMin: 49000, rehabMax: 84000 },
      "Northern Liberties Loft": { price: 428000, rentMin: 3750, rentMax: 4350, arvMin: 495000, arvMax: 555000, rehabMin: 14000, rehabMax: 28000 },
      "Hudson Valley Farmhouse": { price: 728000, rentMin: 5700, rentMax: 6750, arvMin: 870000, arvMax: 990000, rehabMin: 35000, rehabMax: 63000 },
      "Skyline Penthouse": { price: 938000, rentMin: 8250, rentMax: 9750, arvMin: 1080000, arvMax: 1230000, rehabMin: 21000, rehabMax: 42000 },
      "Chestnut Hill Victorian": { price: 818000, rentMin: 6300, rentMax: 7500, arvMin: 975000, arvMax: 1125000, rehabMin: 77000, rehabMax: 133000 },
      "Lakefront Estate": { price: 1088000, rentMin: 8700, rentMax: 10500, arvMin: 1275000, arvMax: 1470000, rehabMin: 28000, rehabMax: 56000 },
      "Graduate Hospital Brownstone": { price: 428000, rentMin: 3900, rentMax: 4500, arvMin: 510000, arvMax: 585000, rehabMin: 31000, rehabMax: 53000 },
      "Rittenhouse Square Condo": { price: 593000, rentMin: 4800, rentMax: 5700, arvMin: 675000, arvMax: 780000, rehabMin: 17000, rehabMax: 35000 },
      "Queen Village Rowhouse": { price: 338000, rentMin: 3150, rentMax: 3750, arvMin: 413000, arvMax: 473000, rehabMin: 39000, rehabMax: 67000 },
      "Society Hill Colonial": { price: 713000, rentMin: 5700, rentMax: 6600, arvMin: 840000, arvMax: 960000, rehabMin: 49000, rehabMax: 77000 },
      "Fairmount Rowhome": { price: 293000, rentMin: 2625, rentMax: 3150, arvMin: 360000, arvMax: 420000, rehabMin: 45000, rehabMax: 73000 },
      "Old City Loft": { price: 518000, rentMin: 4350, rentMax: 5100, arvMin: 600000, arvMax: 690000, rehabMin: 21000, rehabMax: 39000 },
    };

    const updatedProperties: string[] = [];

    for (const [name, values] of Object.entries(priceUpdates)) {
      const result = await db
        .update(schema.properties)
        .set(values)
        .where(eq(schema.properties.name, name));

      updatedProperties.push(name);
      console.log(`Updated ${name}: $${values.price.toLocaleString()}`);
    }

    return { updated: updatedProperties.length, properties: updatedProperties };
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

  async sellRentalProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number; mortgagePayoff: number; netProceeds: number }> {
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
    
    // Get the CURRENT mortgage balance from the deal
    // This is the actual amount owed after any refinancing or principal paydown
    const proFormaOutputs = deal.proFormaOutputs as any;
    const mortgagePayoff = deal.currentLoanBalance ?? proFormaOutputs?.loanAmount ?? 0;
    
    // Rental sale uses MARKET CONDITIONS for correlation with flips
    // Market condition affects the range of sale prices (same as flip logic)
    const marketCondition = gameRun.marketCondition || 'good';
    const marketMult = getMarketMultipliers(marketCondition as MarketCondition);
    
    // Base rental appreciation range: -5% to +15% (rentals appreciate less volatilely than flips)
    // Market condition shifts this range up or down
    const baseMin = 0.95;
    const baseMax = 1.15;
    const adjustedMin = baseMin * marketMult.min; // In terrible market: 0.95 * 0.85 = 0.81
    const adjustedMax = baseMax * marketMult.max; // In excellent market: 1.15 * 1.15 = 1.32
    
    const saleMultiplier = adjustedMin + Math.random() * (adjustedMax - adjustedMin);
    const salePrice = Math.round(purchasePrice * saleMultiplier);
    
    // Net proceeds = gross sale price minus mortgage payoff
    // This is the actual cash the player receives
    const netProceeds = salePrice - mortgagePayoff;
    
    // Profit is based on equity change: sale price - original purchase price
    // (The mortgage payoff doesn't affect profit, just cash flow)
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
    
    // Cash increases by NET proceeds (after paying off mortgage)
    let runningBalance = gameRun.cash;
    
    // Create ledger entries for the sale
    const ledgerEntries: any[] = [];
    
    // First: Credit the gross sale price
    runningBalance += salePrice;
    ledgerEntries.push({
      gameRunId,
      direction: 'credit',
      category: 'sale_proceeds',
      amount: salePrice,
      balanceAfter: runningBalance,
      description: `Sold rental property - ${saleMultiplier >= 1 ? '+' : ''}${Math.round((saleMultiplier - 1) * 100)}% of purchase price`,
      propertyId: deal.propertyId,
      dealId: dealId,
      gameWeek: gameRun.currentWeek,
    });
    
    // Second: Debit the mortgage payoff (if any)
    if (mortgagePayoff > 0) {
      runningBalance -= mortgagePayoff;
      ledgerEntries.push({
        gameRunId,
        direction: 'debit',
        category: 'expense',
        amount: mortgagePayoff,
        balanceAfter: runningBalance,
        description: `🏦 Mortgage payoff`,
        propertyId: deal.propertyId,
        dealId: dealId,
        gameWeek: gameRun.currentWeek,
      });
    }
    
    // Insert all ledger entries
    for (const entry of ledgerEntries) {
      await db.insert(schema.ledgerEntries).values(entry);
    }
    
    const newCash = runningBalance;
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
    
    return {
      deal: updatedDeal,
      gameRun: updatedGameRun,
      saleProfit,
      salePrice,
      purchasePrice,
      mortgagePayoff,
      netProceeds,
    };
  }

  async sellFlipProperty(dealId: number, gameRunId: number): Promise<{ deal: Deal; gameRun: GameRun; saleProfit: number; salePrice: number; purchasePrice: number; netProceeds: number; mortgagePayoff: number }> {
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
    
    // Get property for ARV calculation
    const [property] = await db
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.id, deal.propertyId))
      .limit(1);
    if (!property) throw new Error('Property not found');
    
    const purchasePrice = deal.purchasePrice ?? property.price;
    const proFormaOutputs = deal.proFormaOutputs as any;
    const proFormaInputs = deal.proFormaInputs as any;
    
    // Get the CURRENT mortgage balance from the deal
    const mortgagePayoff = deal.currentLoanBalance ?? proFormaOutputs?.loanAmount ?? 0;
    
    // Calculate sale price based on ARV and rehab investment (not just purchase price!)
    // This mirrors the logic from completeFlipDeal in gameMechanics.ts
    const rehabBudget = proFormaInputs?.rehabBudget || 0;
    const contingencyPct = proFormaInputs?.contingencyPct || 10;
    const actualRehabSpend = rehabBudget * (1 + contingencyPct / 100);
    
    // Calculate rehab completion factor (0 to 1) based on how much was invested
    const rehabRange = property.rehabMax - property.rehabMin;
    const completionFactor = rehabRange > 0 
      ? Math.max(0, Math.min(1, (actualRehabSpend - property.rehabMin) / rehabRange))
      : 0.5;
    
    // Base sale price scales with rehab completion within the ARV range
    const arvRange = property.arvMax - property.arvMin;
    const baseSalePrice = property.arvMin + (completionFactor * arvRange);
    
    // Apply market variance (-5% to +10%)
    const marketVariance = 0.95 + (Math.random() * 0.15);
    const salePrice = Math.round(baseSalePrice * marketVariance);
    const saleMultiplier = salePrice / purchasePrice;
    
    // Net proceeds = sale price minus mortgage payoff (this is what player receives in cash)
    const netProceeds = salePrice - mortgagePayoff;
    
    // Calculate all-in cost for true profit calculation
    const closingCosts = Math.round(purchasePrice * 0.03);
    const loanFees = proFormaOutputs?.loanOriginationFees || Math.round((proFormaOutputs?.loanAmount || 0) * 0.02);
    const sellingCostsPct = proFormaInputs?.sellingCostsPct || 6;
    const sellingCosts = Math.round(salePrice * (sellingCostsPct / 100));
    
    // True profit = sale price - purchase price - rehab - closing costs - loan fees - selling costs
    const allInCost = purchasePrice + actualRehabSpend + closingCosts + loanFees;
    const saleProfit = salePrice - allInCost - sellingCosts;
    
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
    
    // Track running balance for ledger entries
    let runningBalance = gameRun.cash;
    const ledgerEntries: any[] = [];
    
    // First: Credit the gross sale price
    runningBalance += salePrice;
    ledgerEntries.push({
      gameRunId,
      direction: 'credit',
      category: 'sale_proceeds',
      amount: salePrice,
      balanceAfter: runningBalance,
      description: `Sold flip for $${salePrice.toLocaleString()} (ARV-based, ${Math.round(completionFactor * 100)}% rehab completion)`,
      propertyId: deal.propertyId,
      dealId: dealId,
      gameWeek: gameRun.currentWeek,
    });
    
    // Second: Debit the mortgage payoff (if any)
    if (mortgagePayoff > 0) {
      runningBalance -= mortgagePayoff;
      ledgerEntries.push({
        gameRunId,
        direction: 'debit',
        category: 'expense',
        amount: mortgagePayoff,
        balanceAfter: runningBalance,
        description: `Mortgage payoff`,
        propertyId: deal.propertyId,
        dealId: dealId,
        gameWeek: gameRun.currentWeek,
      });
    }
    
    // Third: Debit selling costs (realtor commission, closing costs)
    if (sellingCosts > 0) {
      runningBalance -= sellingCosts;
      ledgerEntries.push({
        gameRunId,
        direction: 'debit',
        category: 'expense',
        amount: sellingCosts,
        balanceAfter: runningBalance,
        description: `Selling costs (${sellingCostsPct}%): realtor, title, closing`,
        propertyId: deal.propertyId,
        dealId: dealId,
        gameWeek: gameRun.currentWeek,
      });
    }
    
    // Insert all ledger entries
    for (const entry of ledgerEntries) {
      await db.insert(schema.ledgerEntries).values(entry);
    }
    
    const newCash = runningBalance;
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
    
    return {
      deal: updatedDeal,
      gameRun: updatedGameRun,
      saleProfit,
      salePrice,
      purchasePrice,
      netProceeds,
      mortgagePayoff,
    };
  }

  async refinanceRentalProperty(
    dealId: number, 
    gameRunId: number, 
    requestedCashOut?: number, 
    selectedLtv?: number,
    allDeals?: Deal[],
    property?: Property
  ): Promise<{ deal: Deal; gameRun: GameRun; cashOut: number; newLoanBalance: number; oldLoanBalance: number; refinanceFees: number; newInterestRate: number }> {
    const SEASONING_WEEKS = 8;
    const REFINANCE_COOLDOWN_WEEKS = 4; // Must wait 4 weeks between refinances
    const REFINANCE_FEE_PCT = 0.02; // 2% refinance fees
    
    const [deal] = await db
      .select()
      .from(schema.deals)
      .where(and(eq(schema.deals.id, dealId), eq(schema.deals.gameRunId, gameRunId)))
      .limit(1);
    
    if (!deal) {
      throw new Error('Deal not found');
    }
    
    if (deal.status !== 'active_rental') {
      throw new Error('Can only refinance active rental properties');
    }
    
    const [gameRun] = await db
      .select()
      .from(schema.gameRuns)
      .where(eq(schema.gameRuns.id, gameRunId))
      .limit(1);
    
    if (!gameRun) {
      throw new Error('Game run not found');
    }
    
    const purchaseWeek = deal.purchaseWeek ?? 0;
    const currentWeek = gameRun.currentWeek;
    const weeksHeld = currentWeek - purchaseWeek;
    
    if (weeksHeld < 0) {
      throw new Error('Invalid seasoning calculation - please contact support');
    }
    
    if (weeksHeld < SEASONING_WEEKS) {
      throw new Error(`Must hold property for ${SEASONING_WEEKS} weeks before refinancing (${SEASONING_WEEKS - weeksHeld} weeks remaining)`);
    }
    
    // Check refinance cooldown (must wait 4 weeks between refinances)
    if (deal.lastRefinanceWeek !== null && deal.lastRefinanceWeek !== undefined) {
      const weeksSinceLastRefi = currentWeek - deal.lastRefinanceWeek;
      if (weeksSinceLastRefi < REFINANCE_COOLDOWN_WEEKS) {
        throw new Error(`Must wait ${REFINANCE_COOLDOWN_WEEKS - weeksSinceLastRefi} more week(s) before refinancing again`);
      }
    }
    
    // Fetch property if not provided
    if (!property) {
      const [prop] = await db
        .select()
        .from(schema.properties)
        .where(eq(schema.properties.id, deal.propertyId))
        .limit(1);
      property = prop;
    }
    
    if (!property) {
      throw new Error('Property not found');
    }
    
    // Calculate current property value with appreciation (deterministic)
    const monthsHeld = Math.floor(weeksHeld / 4.33);
    const baseAppreciation = 0.02;
    const timeAppreciation = Math.min(monthsHeld * 0.005, 0.10);
    const locationBonus = property.locationType === 'urban' ? 0.015 : 0;
    const totalAppreciation = 1 + baseAppreciation + timeAppreciation + locationBonus;
    const currentPropertyValue = Math.round(property.price * totalAppreciation);
    
    const proFormaOutputs = deal.proFormaOutputs as any;
    const oldLoanBalance = deal.currentLoanBalance ?? proFormaOutputs?.loanAmount ?? 0;
    
    // Calculate variable rate based on player's financial situation
    let totalMonthlyDebt = 0;
    let totalMonthlyIncome = 0;
    
    if (allDeals) {
      for (const d of allDeals) {
        if (d.status === 'active_rental') {
          const outputs = d.proFormaOutputs as any;
          totalMonthlyDebt += outputs?.monthlyDebtService || 0;
          totalMonthlyIncome += outputs?.monthlyGrossRent || 0;
        }
      }
    }
    
    const dti = totalMonthlyIncome > 0 ? (totalMonthlyDebt / totalMonthlyIncome) * 100 : 50;
    const reserveMonths = gameRun.cash / (totalMonthlyDebt || 1000);
    
    // Calculate interest rate based on financials (deterministic)
    const baseRate = 7.0;
    const dtiAdjustment = dti > 50 ? (dti - 50) * 0.03 : 0;
    const reserveAdjustment = reserveMonths > 6 ? -0.25 : (reserveMonths < 3 ? 0.5 : 0);
    const currentEquity = currentPropertyValue - oldLoanBalance;
    const equityPercent = (currentEquity / currentPropertyValue) * 100;
    const equityAdjustment = equityPercent > 40 ? -0.25 : (equityPercent < 25 ? 0.5 : 0);
    const newInterestRate = Math.max(5.5, Math.min(12, baseRate + dtiAdjustment + reserveAdjustment + equityAdjustment));
    
    // Calculate new loan based on selected LTV or requested cash out
    let newLoanBalance: number;
    let cashOut: number;
    
    if (selectedLtv) {
      newLoanBalance = Math.round(currentPropertyValue * (selectedLtv / 100));
    } else if (requestedCashOut) {
      // Work backwards from requested cash out
      // cashOut = newLoan - oldLoan - fees
      // cashOut = newLoan - oldLoan - (newLoan * 0.02)
      // cashOut = newLoan * 0.98 - oldLoan
      // newLoan = (cashOut + oldLoan) / 0.98
      newLoanBalance = Math.round((requestedCashOut + oldLoanBalance) / (1 - REFINANCE_FEE_PCT));
    } else {
      // Default: max out at 75% LTV
      newLoanBalance = Math.round(currentPropertyValue * 0.75);
    }
    
    const refinanceFees = Math.round(newLoanBalance * REFINANCE_FEE_PCT);
    cashOut = newLoanBalance - oldLoanBalance - refinanceFees;
    
    if (cashOut <= 0) {
      throw new Error('Not enough equity to refinance - no cash out available');
    }
    
    // Calculate new monthly payment for the refinanced loan
    const newMonthlyRate = newInterestRate / 100 / 12;
    const numPayments = 360; // 30-year fixed
    const newMonthlyPayment = newLoanBalance * (newMonthlyRate * Math.pow(1 + newMonthlyRate, numPayments)) / (Math.pow(1 + newMonthlyRate, numPayments) - 1);
    
    // Update proFormaOutputs with new monthly debt service
    const updatedProFormaOutputs = {
      ...proFormaOutputs,
      monthlyDebtService: newMonthlyPayment,
      debtServiceMonthly: newMonthlyPayment,
      loanAmount: newLoanBalance,
    };
    
    // Update deal with new loan info and reset debt tracking
    // When refinancing, the old loan is paid off and a new one starts
    const [updatedDeal] = await db
      .update(schema.deals)
      .set({
        currentLoanBalance: newLoanBalance,
        originalLoanAmount: newLoanBalance, // Reset to new loan amount for debt panel
        loanInterestRate: Math.round(newInterestRate * 1000000) / 1000000,
        totalPrincipalPaid: 0, // Reset - new loan starts fresh
        totalInterestPaid: 0, // Reset - new loan starts fresh
        loanTermMonths: 360, // 30-year fixed for refinance
        refinanceCount: (deal.refinanceCount ?? 0) + 1,
        lastRefinanceWeek: currentWeek,
        proFormaOutputs: updatedProFormaOutputs, // Update stored monthly payment
      })
      .where(eq(schema.deals.id, dealId))
      .returning();
    
    const newCash = gameRun.cash + cashOut;
    const [updatedGameRun] = await db
      .update(schema.gameRuns)
      .set({
        cash: newCash,
        updatedAt: new Date(),
      })
      .where(eq(schema.gameRuns.id, gameRunId))
      .returning();
    
    // Get old interest rate from deal for ledger display
    const oldInterestRate = deal.loanInterestRate ?? (proFormaOutputs?.interestRate || 7.0);
    
    // Ledger entries show the refinance transaction clearly:
    // 1. Old mortgage payoff (informational - shows what was paid off)
    // 2. New loan proceeds (credit - shows new loan with rate)
    // 3. Refinance fees (debit)
    
    const afterPayoff = gameRun.cash; // Payoff is informational, no cash change
    const afterNewLoan = gameRun.cash + newLoanBalance; // New loan credited
    const afterFees = gameRun.cash + newLoanBalance - refinanceFees; // Fees deducted
    
    await db.insert(schema.ledgerEntries).values([
      {
        gameRunId,
        direction: 'debit',
        category: 'mortgage_payoff',
        amount: oldLoanBalance,
        balanceAfter: afterPayoff,
        description: `Old mortgage payoff ($${oldLoanBalance.toLocaleString()} @ ${Number(oldInterestRate).toFixed(2)}%)`,
        propertyId: deal.propertyId,
        dealId: dealId,
        gameWeek: currentWeek,
      },
      {
        gameRunId,
        direction: 'credit',
        category: 'refinance_proceeds',
        amount: newLoanBalance,
        balanceAfter: afterNewLoan,
        description: `New loan proceeds ($${newLoanBalance.toLocaleString()} @ ${newInterestRate.toFixed(2)}%)`,
        propertyId: deal.propertyId,
        dealId: dealId,
        gameWeek: currentWeek,
      },
      {
        gameRunId,
        direction: 'debit',
        category: 'refinance_fee',
        amount: refinanceFees,
        balanceAfter: newCash,
        description: `Refinance fees (2% of $${newLoanBalance.toLocaleString()} loan)`,
        propertyId: deal.propertyId,
        dealId: dealId,
        gameWeek: currentWeek,
      },
    ]);
    
    return {
      deal: updatedDeal,
      gameRun: updatedGameRun,
      cashOut,
      newLoanBalance,
      oldLoanBalance,
      refinanceFees,
      newInterestRate,
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
      let runningBalance = Math.round(currentCash);
      const createdEntries: LedgerEntry[] = [];

      for (const entry of entries) {
        const roundedAmount = Math.round(entry.amount);
        if (entry.direction === 'debit') {
          runningBalance -= roundedAmount;
        } else {
          runningBalance += roundedAmount;
        }

        const [ledgerEntry] = await tx
          .insert(schema.ledgerEntries)
          .values({
            ...entry,
            amount: roundedAmount,
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

  // Tenant methods
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [created] = await db
      .insert(schema.tenants)
      .values(tenant)
      .returning();
    return created;
  }

  async getTenantByDeal(dealId: number): Promise<Tenant | undefined> {
    const [tenant] = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.dealId, dealId))
      .limit(1);
    return tenant;
  }

  async getTenantsByGameRun(gameRunId: number): Promise<Tenant[]> {
    // Get all tenants for active rentals in this game run
    const deals = await db
      .select()
      .from(schema.deals)
      .where(and(
        eq(schema.deals.gameRunId, gameRunId),
        eq(schema.deals.status, 'active_rental')
      ));
    
    if (deals.length === 0) return [];
    
    const dealIds = deals.map(d => d.id);
    const tenants = await db
      .select()
      .from(schema.tenants)
      .where(
        // Filter tenants by deal IDs using OR conditions
        dealIds.length > 0 
          ? eq(schema.tenants.dealId, dealIds[0]) 
          : eq(schema.tenants.dealId, -1)
      );
    
    // If more deal IDs, need to get them all
    if (dealIds.length > 1) {
      const allTenants: Tenant[] = [];
      for (const dealId of dealIds) {
        const [tenant] = await db
          .select()
          .from(schema.tenants)
          .where(eq(schema.tenants.dealId, dealId));
        if (tenant) allTenants.push(tenant);
      }
      return allTenants;
    }
    
    return tenants;
  }

  async updateTenant(id: number, updates: Partial<InsertTenant>): Promise<Tenant | undefined> {
    const [updated] = await db
      .update(schema.tenants)
      .set(updates)
      .where(eq(schema.tenants.id, id))
      .returning();
    return updated;
  }
  
  async getLastCurveballForDeal(dealId: number): Promise<string | undefined> {
    const [event] = await db
      .select({ curveballId: schema.curveballEvents.curveballId })
      .from(schema.curveballEvents)
      .where(eq(schema.curveballEvents.dealId, dealId))
      .orderBy(desc(schema.curveballEvents.gameWeek))
      .limit(1);
    return event?.curveballId;
  }

  // Coupon methods
  async createCoupon(coupon: InsertCoupon): Promise<Coupon> {
    const [created] = await db
      .insert(schema.coupons)
      .values(coupon)
      .returning();
    return created;
  }

  async getCouponByCode(code: string): Promise<Coupon | undefined> {
    const [coupon] = await db
      .select()
      .from(schema.coupons)
      .where(eq(schema.coupons.code, code.toUpperCase()))
      .limit(1);
    return coupon;
  }

  async getAllCoupons(): Promise<Coupon[]> {
    return await db
      .select()
      .from(schema.coupons)
      .orderBy(desc(schema.coupons.createdAt));
  }

  async updateCoupon(id: number, updates: Partial<InsertCoupon>): Promise<Coupon | undefined> {
    const [updated] = await db
      .update(schema.coupons)
      .set(updates)
      .where(eq(schema.coupons.id, id))
      .returning();
    return updated;
  }

  async hasRedeemedCoupon(couponId: number, gameRunId: number): Promise<boolean> {
    const [redemption] = await db
      .select()
      .from(schema.couponRedemptions)
      .where(and(
        eq(schema.couponRedemptions.couponId, couponId),
        eq(schema.couponRedemptions.gameRunId, gameRunId)
      ))
      .limit(1);
    return !!redemption;
  }

  async redeemCoupon(couponId: number, gameRunId: number): Promise<{ coupon: Coupon; gameRun: GameRun; cashAdded: number; monthsAdded: number }> {
    // Use a transaction for atomic redemption
    return await db.transaction(async (tx) => {
      // Get coupon with a row lock (select for update pattern via transaction)
      const [coupon] = await tx
        .select()
        .from(schema.coupons)
        .where(eq(schema.coupons.id, couponId));
      
      if (!coupon) throw new Error('Coupon not found');
      
      // Re-check usage limit within transaction
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        throw new Error('Coupon has reached its usage limit');
      }
      
      const [gameRun] = await tx
        .select()
        .from(schema.gameRuns)
        .where(eq(schema.gameRuns.id, gameRunId));
      
      if (!gameRun) throw new Error('Game run not found');

      // Check if already redeemed within transaction
      const [existingRedemption] = await tx
        .select()
        .from(schema.couponRedemptions)
        .where(and(
          eq(schema.couponRedemptions.couponId, couponId),
          eq(schema.couponRedemptions.gameRunId, gameRunId)
        ))
        .limit(1);
      
      if (existingRedemption) {
        throw new Error('Coupon already redeemed in this game');
      }

      // Record redemption
      await tx
        .insert(schema.couponRedemptions)
        .values({ couponId, gameRunId });

      // Increment usage count atomically
      await tx
        .update(schema.coupons)
        .set({ usageCount: coupon.usageCount + 1 })
        .where(eq(schema.coupons.id, couponId));

      // Update game run with bonuses
      const [updatedGameRun] = await tx
        .update(schema.gameRuns)
        .set({
          cash: gameRun.cash + coupon.cashAmount,
          weeksRemaining: gameRun.weeksRemaining + coupon.monthsAmount,
        })
        .where(eq(schema.gameRuns.id, gameRunId))
        .returning();

      return {
        coupon,
        gameRun: updatedGameRun,
        cashAdded: coupon.cashAmount,
        monthsAdded: coupon.monthsAmount,
      };
    });
  }
}

export const storage = new DBStorage();
