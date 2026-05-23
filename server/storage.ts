import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { MarketCondition } from "@shared/schema";
import { getMarketMultipliers, calculateFlipSalePrice } from "./gameMechanics";
import { calculateDealXp } from "@shared/streakTiers";

// Compute the streak/XP/season-stats delta for a single deal close.
// Pure function so it stays unit-testable and easy to reason about.
function applyStreakAndXpUpdate(
  gameRun: schema.GameRun,
  profit: number,
  basis: number,
  dealLabel: string,
): {
  currentStreak: number;
  bestStreak: number;
  xp: number;
  seasonStats: NonNullable<schema.GameRun['seasonStats']>;
} {
  const isProfitable = profit > 0;
  const xpEarned = calculateDealXp(profit, basis);
  const nextStreak = isProfitable ? (gameRun.currentStreak ?? 0) + 1 : 0;
  const nextBest = Math.max(gameRun.bestStreak ?? 0, nextStreak);
  const nextXp = (gameRun.xp ?? 0) + xpEarned;

  const prev = gameRun.seasonStats ?? {
    bestDealProfit: 0,
    bestDealLabel: '',
    totalCashFlow: 0,
    dealsClosed: 0,
    profitableThisSeason: 0,
    xpEarnedThisSeason: 0,
  };
  const seasonStats = {
    bestDealProfit: profit > prev.bestDealProfit ? profit : prev.bestDealProfit,
    bestDealLabel: profit > prev.bestDealProfit ? dealLabel : prev.bestDealLabel,
    totalCashFlow: prev.totalCashFlow + profit,
    dealsClosed: prev.dealsClosed + 1,
    profitableThisSeason: prev.profitableThisSeason + (isProfitable ? 1 : 0),
    xpEarnedThisSeason: prev.xpEarnedThisSeason + xpEarned,
  };

  return {
    currentStreak: nextStreak,
    bestStreak: nextBest,
    xp: nextXp,
    seasonStats,
  };
}
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
  CouponRedemption,
  Achievement,
  InsertAchievement
} from "@shared/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

export const db = drizzle(pool, { schema });

const ALL_PROPERTIES: InsertProperty[] = [
  {
    name: "Oakwood Cottage",
    price: 245000,
    sizeSqft: 1200,
    neighborhood: "Oakwood",
    rentMin: 2150,
    rentMax: 2650,
    arvMin: 275000,
    arvMax: 310000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 8000,
    rehabMax: 19000,
    timelineMin: 2,
    timelineMax: 4,
    offMarketRate: 0.1,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Riverside Ranch",
    price: 329000,
    sizeSqft: 1600,
    neighborhood: "Riverside",
    rentMin: 2800,
    rentMax: 3300,
    arvMin: 405000,
    arvMax: 470000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 55000,
    rehabMax: 86000,
    timelineMin: 8,
    timelineMax: 14,
    offMarketRate: 0.12,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Maplewood Colonial",
    price: 315000,
    sizeSqft: 1450,
    neighborhood: "Maplewood",
    rentMin: 2350,
    rentMax: 3000,
    arvMin: 375000,
    arvMax: 440000,
    conditionTag: "Fixer-Upper",
    photoUrl: null,
    rehabMin: 47000,
    rehabMax: 86000,
    timelineMin: 6,
    timelineMax: 12,
    offMarketRate: 0.15,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Downtown Loft",
    price: 375000,
    sizeSqft: 1800,
    neighborhood: "Downtown",
    rentMin: 3650,
    rentMax: 4300,
    arvMin: 425000,
    arvMax: 490000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 12000,
    rehabMax: 24000,
    timelineMin: 2,
    timelineMax: 4,
    offMarketRate: 0.25,
    viabilityProfile: "rent-mirage",
    isActive: true,
  },
  {
    name: "Elmwood Bungalow",
    price: 215000,
    sizeSqft: 1350,
    neighborhood: "Elmwood",
    rentMin: 2000,
    rentMax: 2500,
    arvMin: 305000,
    arvMax: 355000,
    conditionTag: "Fixer-Upper",
    photoUrl: null,
    rehabMin: 70000,
    rehabMax: 133000,
    timelineMin: 10,
    timelineMax: 20,
    offMarketRate: 0.08,
    viabilityProfile: "rehab-sinkhole",
    isActive: true,
  },
  {
    name: "Hillside Retreat",
    price: 279000,
    sizeSqft: 1500,
    neighborhood: "Hillside",
    rentMin: 2500,
    rentMax: 3000,
    arvMin: 340000,
    arvMax: 398000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 39000,
    rehabMax: 70000,
    timelineMin: 12,
    timelineMax: 24,
    offMarketRate: 0.18,
    viabilityProfile: "time-bomb",
    isActive: true,
    locationType: "suburban",
    propertyType: "house",
  },
  {
    name: "Westside Manor",
    price: 465000,
    sizeSqft: 2000,
    neighborhood: "Westside",
    rentMin: 4000,
    rentMax: 4650,
    arvMin: 540000,
    arvMax: 610000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 63000,
    rehabMax: 102000,
    timelineMin: 8,
    timelineMax: 14,
    offMarketRate: 0.22,
    viabilityProfile: "leverage-trap",
    isActive: true,
  },
  {
    name: "South Street Twin",
    propertyType: "duplex",
    price: 279000,
    sizeSqft: 1400,
    neighborhood: "South Street",
    rentMin: 2400,
    rentMax: 2900,
    arvMin: 340000,
    arvMax: 390000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 31000,
    rehabMax: 55000,
    timelineMin: 5,
    timelineMax: 10,
    offMarketRate: 0.16,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Fishtown Row House",
    price: 335000,
    sizeSqft: 1500,
    neighborhood: "Fishtown",
    rentMin: 3000,
    rentMax: 3500,
    arvMin: 415000,
    arvMax: 475000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 24000,
    rehabMax: 44000,
    timelineMin: 4,
    timelineMax: 8,
    offMarketRate: 0.20,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Port Richmond Duplex",
    propertyType: "duplex",
    price: 399000,
    sizeSqft: 2200,
    neighborhood: "Port Richmond",
    rentMin: 4000,
    rentMax: 4650,
    arvMin: 475000,
    arvMax: 545000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 47000,
    rehabMax: 78000,
    timelineMin: 6,
    timelineMax: 12,
    offMarketRate: 0.18,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Kensington Row",
    price: 249000,
    sizeSqft: 1350,
    neighborhood: "Kensington",
    rentMin: 2250,
    rentMax: 2750,
    arvMin: 335000,
    arvMax: 385000,
    conditionTag: "Fixer-Upper",
    photoUrl: null,
    rehabMin: 55000,
    rehabMax: 94000,
    timelineMin: 8,
    timelineMax: 16,
    offMarketRate: 0.14,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Northern Liberties Loft",
    price: 485000,
    sizeSqft: 1800,
    neighborhood: "Northern Liberties",
    rentMin: 4150,
    rentMax: 4800,
    arvMin: 560000,
    arvMax: 625000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 16000,
    rehabMax: 31000,
    timelineMin: 3,
    timelineMax: 6,
    offMarketRate: 0.28,
    viabilityProfile: "viable",
    isActive: true,
  },
  {
    name: "Hudson Valley Farmhouse",
    price: 815000,
    sizeSqft: 2800,
    neighborhood: "Hudson Valley",
    rentMin: 6300,
    rentMax: 7500,
    arvMin: 975000,
    arvMax: 1110000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 39000,
    rehabMax: 70000,
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
    price: 1050000,
    sizeSqft: 2200,
    neighborhood: "Center City",
    rentMin: 9200,
    rentMax: 10800,
    arvMin: 1210000,
    arvMax: 1380000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 24000,
    rehabMax: 47000,
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
    price: 925000,
    sizeSqft: 3200,
    neighborhood: "Chestnut Hill",
    rentMin: 7000,
    rentMax: 8300,
    arvMin: 1095000,
    arvMax: 1265000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 86000,
    rehabMax: 149000,
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
    price: 1225000,
    sizeSqft: 3800,
    neighborhood: "Lake Nockamixon",
    rentMin: 9700,
    rentMax: 11700,
    arvMin: 1430000,
    arvMax: 1650000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 31000,
    rehabMax: 63000,
    timelineMin: 5,
    timelineMax: 10,
    offMarketRate: 0.08,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "suburban",
    propertyType: "house",
  },
  {
    name: "Old City Carriage House",
    price: 1485000,
    sizeSqft: 2900,
    neighborhood: "Old City",
    rentMin: 11500,
    rentMax: 13500,
    arvMin: 1660000,
    arvMax: 1880000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 48000,
    rehabMax: 92000,
    timelineMin: 6,
    timelineMax: 12,
    offMarketRate: 0.18,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "urban",
    propertyType: "townhouse",
  },
  {
    name: "Society Hill Federal",
    price: 1795000,
    sizeSqft: 4100,
    neighborhood: "Society Hill",
    rentMin: 11000,
    rentMax: 13200,
    arvMin: 2150000,
    arvMax: 2450000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 145000,
    rehabMax: 245000,
    timelineMin: 14,
    timelineMax: 24,
    offMarketRate: 0.10,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "urban",
    propertyType: "house",
  },
  {
    name: "Main Line Manor",
    price: 2250000,
    sizeSqft: 5200,
    neighborhood: "Bryn Mawr",
    rentMin: 13800,
    rentMax: 16400,
    arvMin: 2540000,
    arvMax: 2860000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 62000,
    rehabMax: 118000,
    timelineMin: 6,
    timelineMax: 12,
    offMarketRate: 0.07,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "suburban",
    propertyType: "house",
  },
  {
    name: "Rittenhouse Skyhouse",
    price: 2895000,
    sizeSqft: 3600,
    neighborhood: "Rittenhouse Square",
    rentMin: 19500,
    rentMax: 22500,
    arvMin: 3200000,
    arvMax: 3580000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 38000,
    rehabMax: 75000,
    timelineMin: 4,
    timelineMax: 8,
    offMarketRate: 0.32,
    viabilityProfile: "leverage-trap",
    isActive: true,
    locationType: "urban",
    propertyType: "condo",
  },
  {
    name: "Northern Liberties Brownstone",
    price: 1395000,
    sizeSqft: 2750,
    neighborhood: "Northern Liberties",
    rentMin: 10500,
    rentMax: 12400,
    arvMin: 1580000,
    arvMax: 1790000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 52000,
    rehabMax: 98000,
    timelineMin: 6,
    timelineMax: 12,
    offMarketRate: 0.20,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "urban",
    propertyType: "townhouse",
  },
  {
    name: "Delaware Waterfront Modern",
    price: 1825000,
    sizeSqft: 3400,
    neighborhood: "Penns Landing",
    rentMin: 13200,
    rentMax: 15600,
    arvMin: 2095000,
    arvMax: 2380000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 36000,
    rehabMax: 78000,
    timelineMin: 4,
    timelineMax: 9,
    offMarketRate: 0.28,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "urban",
    propertyType: "house",
  },
  {
    name: "Rittenhouse Historic Mansion",
    price: 2395000,
    sizeSqft: 5800,
    neighborhood: "Rittenhouse Square",
    rentMin: 14500,
    rentMax: 17500,
    arvMin: 2780000,
    arvMax: 3150000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 178000,
    rehabMax: 295000,
    timelineMin: 14,
    timelineMax: 26,
    offMarketRate: 0.09,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "urban",
    propertyType: "house",
  },
  {
    name: "Wissahickon Architect Estate",
    price: 3250000,
    sizeSqft: 6400,
    neighborhood: "Chestnut Hill",
    rentMin: 18500,
    rentMax: 21800,
    arvMin: 3700000,
    arvMax: 4150000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 72000,
    rehabMax: 142000,
    timelineMin: 6,
    timelineMax: 12,
    offMarketRate: 0.30,
    viabilityProfile: "leverage-trap",
    isActive: true,
    locationType: "suburban",
    propertyType: "house",
  },
  {
    name: "Graduate Hospital Brownstone",
    price: 485000,
    sizeSqft: 1900,
    neighborhood: "Graduate Hospital",
    rentMin: 4350,
    rentMax: 5000,
    arvMin: 575000,
    arvMax: 660000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 35000,
    rehabMax: 59000,
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
    price: 669000,
    sizeSqft: 1400,
    neighborhood: "Rittenhouse Square",
    rentMin: 5350,
    rentMax: 6300,
    arvMin: 760000,
    arvMax: 875000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 19000,
    rehabMax: 39000,
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
    price: 385000,
    sizeSqft: 1650,
    neighborhood: "Queen Village",
    rentMin: 3500,
    rentMax: 4150,
    arvMin: 465000,
    arvMax: 535000,
    conditionTag: "Fair",
    photoUrl: null,
    rehabMin: 44000,
    rehabMax: 75000,
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
    price: 799000,
    sizeSqft: 2400,
    neighborhood: "Society Hill",
    rentMin: 6350,
    rentMax: 7350,
    arvMin: 945000,
    arvMax: 1080000,
    conditionTag: "Good",
    photoUrl: null,
    rehabMin: 55000,
    rehabMax: 86000,
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
    price: 335000,
    sizeSqft: 1550,
    neighborhood: "Fairmount",
    rentMin: 2900,
    rentMax: 3500,
    arvMin: 405000,
    arvMax: 475000,
    conditionTag: "Fixer-Upper",
    photoUrl: null,
    rehabMin: 50000,
    rehabMax: 82000,
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
    price: 585000,
    sizeSqft: 1700,
    neighborhood: "Old City",
    rentMin: 4850,
    rentMax: 5650,
    arvMin: 675000,
    arvMax: 775000,
    conditionTag: "Excellent",
    photoUrl: null,
    rehabMin: 24000,
    rehabMax: 44000,
    timelineMin: 4,
    timelineMax: 8,
    offMarketRate: 0.28,
    viabilityProfile: "viable",
    isActive: true,
    locationType: "urban",
    propertyType: "condo",
  },
];

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
  addNewLuxuryProperties(): Promise<void>;
  backfillPropertyCharacteristics(): Promise<void>;

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
  createLedgerEntriesOnly(gameRunId: number, entries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[], currentCash: number): Promise<{ entries: LedgerEntry[], newCash: number }>;

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
  deleteTenant(id: number): Promise<void>;
  
  // Curveball methods
  getLastCurveballForDeal(dealId: number): Promise<string | undefined>;

  // Coupon methods
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  getCouponByCode(code: string): Promise<Coupon | undefined>;
  getAllCoupons(): Promise<Coupon[]>;
  updateCoupon(id: number, updates: Partial<InsertCoupon>): Promise<Coupon | undefined>;
  redeemCoupon(couponId: number, gameRunId: number): Promise<{ coupon: Coupon; gameRun: GameRun; cashAdded: number; monthsAdded: number }>;
  hasRedeemedCoupon(couponId: number, gameRunId: number): Promise<boolean>;

  // Achievement methods
  getAchievements(gameRunId: number): Promise<Achievement[]>;
  unlockAchievement(gameRunId: number, achievementId: string, metadata?: any): Promise<Achievement>;
  hasAchievement(gameRunId: number, achievementId: string): Promise<boolean>;
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
          sql`LOWER(${schema.gameRuns.playerName}) = LOWER(${playerName})`,
          eq(schema.gameRuns.status, "active")
        )
      )
      .orderBy(desc(schema.gameRuns.createdAt))
      .limit(1);
    return run;
  }

  async deleteGameRun(id: number): Promise<void> {
    await db.transaction(async (tx) => {
      // Tenants reference deals via dealId, so they must go before deals.
      const dealsForRun = await tx
        .select({ id: schema.deals.id })
        .from(schema.deals)
        .where(eq(schema.deals.gameRunId, id));
      const dealIds = dealsForRun.map((d) => d.id);
      if (dealIds.length > 0) {
        await tx.delete(schema.tenants).where(inArray(schema.tenants.dealId, dealIds));
      }

      // All tables with a non-nullable FK to game_runs must be deleted first.
      await tx.delete(schema.achievements).where(eq(schema.achievements.gameRunId, id));
      await tx.delete(schema.couponRedemptions).where(eq(schema.couponRedemptions.gameRunId, id));
      await tx.delete(schema.curveballEvents).where(eq(schema.curveballEvents.gameRunId, id));
      await tx.delete(schema.propertyInvestigations).where(eq(schema.propertyInvestigations.gameRunId, id));
      await tx.delete(schema.ledgerEntries).where(eq(schema.ledgerEntries.gameRunId, id));
      await tx.delete(schema.deals).where(eq(schema.deals.gameRunId, id));

      // playerTrophies has a nullable FK — keep the trophy record but detach it
      // so the player's Hall of Fame trophies survive when the game is replaced.
      await tx
        .update(schema.playerTrophies)
        .set({ gameRunId: null })
        .where(eq(schema.playerTrophies.gameRunId, id));

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


    await db.insert(schema.properties).values(ALL_PROPERTIES);

    const starterProperties: InsertProperty[] = [
      {
        name: "Oakwood Cottage",
        price: 218000,
        sizeSqft: 1200,
        neighborhood: "Oakwood",
        rentMin: 1950,
        rentMax: 2400,
        arvMin: 248000,
        arvMax: 290000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 7000,
        rehabMax: 15000,
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
        arvMin: 368000,
        arvMax: 432000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 46000,
        rehabMax: 72000,
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
        arvMin: 338000,
        arvMax: 400000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 40000,
        rehabMax: 72000,
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
        propertyType: "duplex",
        price: 248000,
        sizeSqft: 1400,
        neighborhood: "South Street",
        rentMin: 2175,
        rentMax: 2625,
        arvMin: 308000,
        arvMax: 365000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 28000,
        rehabMax: 45000,
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
        arvMin: 375000,
        arvMax: 435000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 21000,
        rehabMax: 35000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.20,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Port Richmond Duplex",
        propertyType: "duplex",
        price: 353000,
        sizeSqft: 2200,
        neighborhood: "Port Richmond",
        rentMin: 3600,
        rentMax: 4200,
        arvMin: 428000,
        arvMax: 495000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 42000,
        rehabMax: 65000,
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
        arvMin: 300000,
        arvMax: 355000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 46000,
        rehabMax: 78000,
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
        name: "Old City Carriage House",
        price: 1320000,
        sizeSqft: 2900,
        neighborhood: "Old City",
        rentMin: 10300,
        rentMax: 12100,
        arvMin: 1480000,
        arvMax: 1670000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 43000,
        rehabMax: 82000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.18,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "townhouse",
      },
      {
        name: "Society Hill Federal",
        price: 1595000,
        sizeSqft: 4100,
        neighborhood: "Society Hill",
        rentMin: 9800,
        rentMax: 11800,
        arvMin: 1915000,
        arvMax: 2180000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 130000,
        rehabMax: 218000,
        timelineMin: 14,
        timelineMax: 24,
        offMarketRate: 0.10,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "house",
      },
      {
        name: "Main Line Manor",
        price: 2000000,
        sizeSqft: 5200,
        neighborhood: "Bryn Mawr",
        rentMin: 12300,
        rentMax: 14600,
        arvMin: 2260000,
        arvMax: 2545000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 55000,
        rehabMax: 105000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.07,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "suburban",
        propertyType: "house",
      },
      {
        name: "Rittenhouse Skyhouse",
        price: 2575000,
        sizeSqft: 3600,
        neighborhood: "Rittenhouse Square",
        rentMin: 17400,
        rentMax: 20000,
        arvMin: 2848000,
        arvMax: 3185000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 34000,
        rehabMax: 67000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.32,
        viabilityProfile: "leverage-trap",
        isActive: true,
        locationType: "urban",
        propertyType: "condo",
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

  async backfillPropertyCharacteristics(): Promise<void> {
    const allProperties = await db.select().from(schema.properties);

    // Compute derived values for all properties that need backfill,
    // then batch updates by grouping identical characteristics
    type CharKey = `${number}|${number}|${string}|${string}`;
    const groups = new Map<CharKey, number[]>();

    for (const prop of allProperties) {
      // Skip if already backfilled (non-default values present)
      if (prop.bedrooms !== 3 || prop.bathrooms !== 1.5) continue;

      const sqft = prop.sizeSqft;
      const type = prop.propertyType;
      const location = prop.locationType;

      // Bedrooms based on sqft and type
      let bedrooms: number;
      if (type === 'condo' || type === 'apartment') {
        bedrooms = sqft < 900 ? 1 : sqft < 1400 ? 2 : 3;
      } else if (type === 'duplex') {
        bedrooms = sqft < 1600 ? 3 : sqft < 2200 ? 4 : 5;
      } else {
        bedrooms = sqft < 1000 ? 2 : sqft < 1600 ? 3 : sqft < 2200 ? 4 : 5;
      }

      // Bathrooms based on bedrooms
      let bathrooms: number;
      if (bedrooms <= 2) bathrooms = 1;
      else if (bedrooms === 3) bathrooms = 1.5;
      else if (bedrooms === 4) bathrooms = 2;
      else bathrooms = 2.5;

      // Water: urban = public, suburban = well for rural properties, public for city-adjacent suburbs
      const WELL_WATER_PROPERTIES = new Set([
        'Hillside Retreat', 'Hudson Valley Farmhouse', 'Lakefront Estate',
        'Delaware Waterfront Modern', 'Wissahickon Architect Estate', 'Main Line Manor',
      ]);
      const waterSource = location === 'urban' ? 'public' 
        : WELL_WATER_PROPERTIES.has(prop.name) ? 'well' 
        : (sqft > 1800 ? 'well' : 'public');

      // Heat type based on property type and price
      let heatType: string;
      if (type === 'condo' || type === 'apartment') {
        heatType = 'electric';
      } else if (prop.price > 500000) {
        heatType = 'gas';
      } else {
        heatType = location === 'urban' ? 'gas' : 'oil';
      }

      const key: CharKey = `${bedrooms}|${bathrooms}|${waterSource}|${heatType}`;
      const ids = groups.get(key) || [];
      ids.push(prop.id);
      groups.set(key, ids);
    }

    // Issue one UPDATE per unique characteristic set
    for (const [key, ids] of groups) {
      const [bedrooms, bathrooms, waterSource, heatType] = key.split('|');
      await db
        .update(schema.properties)
        .set({
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          waterSource,
          heatType,
        })
        .where(inArray(schema.properties.id, ids));
    }

    // Explicitly fix waterSource for properties that must have well/septic
    const WELL_WATER_NAMES = [
      'Hillside Retreat', 'Hudson Valley Farmhouse', 'Lakefront Estate',
      'Delaware Waterfront Modern', 'Wissahickon Architect Estate', 'Main Line Manor',
    ];
    for (const name of WELL_WATER_NAMES) {
      await db
        .update(schema.properties)
        .set({ waterSource: 'well' })
        .where(eq(schema.properties.name, name));
    }
  }

  async addNewUrbanProperties(): Promise<void> {

    const newUrbanProperties: InsertProperty[] = [
      {
        name: "South Street Twin",
        propertyType: "duplex",
        price: 248000,
        sizeSqft: 1400,
        neighborhood: "South Street",
        rentMin: 2175,
        rentMax: 2625,
        arvMin: 308000,
        arvMax: 365000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 28000,
        rehabMax: 45000,
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
        arvMin: 375000,
        arvMax: 435000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 21000,
        rehabMax: 35000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.20,
        viabilityProfile: "viable",
        isActive: true,
      },
      {
        name: "Port Richmond Duplex",
        propertyType: "duplex",
        price: 353000,
        sizeSqft: 2200,
        neighborhood: "Port Richmond",
        rentMin: 3600,
        rentMax: 4200,
        arvMin: 428000,
        arvMax: 495000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 42000,
        rehabMax: 65000,
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
        arvMin: 300000,
        arvMax: 355000,
        conditionTag: "Fixer-Upper",
        photoUrl: null,
        rehabMin: 46000,
        rehabMax: 78000,
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

    const additionalProperties: InsertProperty[] = [
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

    const allNewProperties = [...newUrbanProperties, ...additionalProperties];

    // Check which properties don't exist yet and insert only those
    for (const prop of allNewProperties) {

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

  async addNewLuxuryProperties(): Promise<void> {
    const luxuryProperties: InsertProperty[] = [
      {
        name: "Old City Carriage House",
        price: 1485000,
        sizeSqft: 2900,
        neighborhood: "Old City",
        rentMin: 11500,
        rentMax: 13500,
        arvMin: 1660000,
        arvMax: 1880000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 48000,
        rehabMax: 92000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.18,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "townhouse",
      },
      {
        name: "Society Hill Federal",
        price: 1795000,
        sizeSqft: 4100,
        neighborhood: "Society Hill",
        rentMin: 11000,
        rentMax: 13200,
        arvMin: 2150000,
        arvMax: 2450000,
        conditionTag: "Fair",
        photoUrl: null,
        rehabMin: 145000,
        rehabMax: 245000,
        timelineMin: 14,
        timelineMax: 24,
        offMarketRate: 0.10,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "urban",
        propertyType: "house",
      },
      {
        name: "Main Line Manor",
        price: 2250000,
        sizeSqft: 5200,
        neighborhood: "Bryn Mawr",
        rentMin: 13800,
        rentMax: 16400,
        arvMin: 2540000,
        arvMax: 2860000,
        conditionTag: "Good",
        photoUrl: null,
        rehabMin: 62000,
        rehabMax: 118000,
        timelineMin: 6,
        timelineMax: 12,
        offMarketRate: 0.07,
        viabilityProfile: "viable",
        isActive: true,
        locationType: "suburban",
        propertyType: "house",
      },
      {
        name: "Rittenhouse Skyhouse",
        price: 2895000,
        sizeSqft: 3600,
        neighborhood: "Rittenhouse Square",
        rentMin: 19500,
        rentMax: 22500,
        arvMin: 3200000,
        arvMax: 3580000,
        conditionTag: "Excellent",
        photoUrl: null,
        rehabMin: 38000,
        rehabMax: 75000,
        timelineMin: 4,
        timelineMax: 8,
        offMarketRate: 0.32,
        viabilityProfile: "leverage-trap",
        isActive: true,
        locationType: "urban",
        propertyType: "condo",
      },
    ];

    for (const prop of luxuryProperties) {
      const existing = await db
        .select()
        .from(schema.properties)
        .where(eq(schema.properties.name, prop.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(schema.properties).values(prop);
        console.log(`Added new luxury property: ${prop.name} ($${prop.price.toLocaleString()})`);
      }
    }
  }

  async refreshPropertyPrices(): Promise<{ updated: number; properties: string[] }> {


    const priceUpdates: Record<string, {
      price: number;
      rentMin: number;
      rentMax: number;
      arvMin: number;
      arvMax: number;
      rehabMin: number;
      rehabMax: number;
    }> = {};
    for (const prop of ALL_PROPERTIES) {
      priceUpdates[prop.name] = {
        price: prop.price,
        rentMin: prop.rentMin,
        rentMax: prop.rentMax,
        arvMin: prop.arvMin,
        arvMax: prop.arvMax,
        rehabMin: prop.rehabMin,
        rehabMax: prop.rehabMax,
      };
    }


    // Run all property updates in parallel — these are independent rows.
    await Promise.all(
      ALL_PROPERTIES.map((prop) =>
        db
          .update(schema.properties)
          .set({
            price: prop.price,
            rentMin: prop.rentMin,
            rentMax: prop.rentMax,
            arvMin: prop.arvMin,
            arvMax: prop.arvMax,
            rehabMin: prop.rehabMin,
            rehabMax: prop.rehabMax,
          })
          .where(eq(schema.properties.name, prop.name)),
      ),
    );

    const updatedProperties = ALL_PROPERTIES.map((p) => p.name);
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
      throw new Error('Not enough time remaining to sell (need 2 months)');
    }
    
    // Fetch property for condition/issue analysis and price fallback
    const [property] = await db
      .select()
      .from(schema.properties)
      .where(eq(schema.properties.id, deal.propertyId))
      .limit(1);
    if (!property) throw new Error('Property not found');
    
    let purchasePrice = deal.purchasePrice ?? 0;
    if (purchasePrice <= 0) {
      purchasePrice = property.price;
    }
    
    // Get the CURRENT mortgage balance from the deal
    const proFormaOutputs = deal.proFormaOutputs as any;
    const mortgagePayoff = deal.currentLoanBalance ?? proFormaOutputs?.loanAmount ?? 0;
    
    // === MULTI-FACTOR RENTAL SALE PRICE ===
    // Sale price driven by: market, diligence, property condition, time held,
    // tenant satisfaction, repairs done, and cosmetic upgrades
    
    const proFormaInputs = deal.proFormaInputs as any;
    const marketCondition = gameRun.marketCondition || 'good';
    const marketMult = getMarketMultipliers(marketCondition as MarketCondition);
    
    // 1. TIME HELD — longer hold = more organic appreciation (above market trend)
    //    Months 1-3: minimal (0-2%), 4-12: moderate (2-6%), 13-24: good (6-10%), 24+: caps at ~10%
    //    Uses purchaseWeek (true acquisition date); falls back for legacy rows.
    const purchaseWeek = deal.purchaseWeek
      ?? deal.firstIncomePaymentWeek
      ?? deal.lastIncomePaymentWeek
      ?? gameRun.currentWeek;
    const monthsHeld = Math.max(1, gameRun.currentWeek - purchaseWeek);
    const holdAppreciation = Math.min(0.10, monthsHeld * 0.004); // 0.4% per month, cap 10%
    
    // 2. DILIGENCE — did due diligence before buying? Better knowledge = better negotiation on sale
    const investigations = await db
      .select()
      .from(schema.propertyInvestigations)
      .where(eq(schema.propertyInvestigations.gameRunId, gameRunId));
    const completedDiligence = investigations
      .filter(inv => inv.propertyId === deal.propertyId)
      .map(inv => inv.investigationType);
    const diligenceCount = ['appraisal', 'contractor_walkthrough', 'inspection', 'title_search']
      .filter(d => completedDiligence.includes(d)).length;
    const diligenceBonus = diligenceCount === 0 ? -0.02
      : diligenceCount === 1 ? 0.01
      : diligenceCount === 2 ? 0.03
      : diligenceCount === 3 ? 0.05
      : 0.07; // all 4
    
    // 3. PROPERTY CONDITION — unfixed issues reduce value, fixed issues boost it
    const { getRandomizedPropertyIssues } = await import('@shared/propertyIssues');
    const allIssues = getRandomizedPropertyIssues(
      gameRunId, deal.propertyId,
      property.propertyType, property.conditionTag,
      property.waterSource || 'public'
    );
    const rawFixedIssueIds = proFormaInputs?.fixedIssueIds || [];
    const fixedIssueIds = [...new Set(rawFixedIssueIds)].filter((id: string) => allIssues.some(i => i.id === id));
    const undiscoveredIssues = allIssues.filter(issue =>
      !issue.discoveredBy.some(method => completedDiligence.includes(method))
    );
    const discoveredButSkipped = allIssues.filter(issue =>
      issue.discoveredBy.some(method => completedDiligence.includes(method)) &&
      !fixedIssueIds.includes(issue.id)
    );
    // Unfixed issues are a drag on value (buyers find them during their inspection)
    const conditionPenalty = (undiscoveredIssues.length * 0.025) + (discoveredButSkipped.length * 0.02);
    const fixedBonus = fixedIssueIds.length > 0 ? Math.min(fixedIssueIds.length * 0.012, 0.06) : 0;
    
    // 4. TENANT SATISFACTION — well-managed property presents better to buyers
    let tenantBonus = 0;
    try {
      const tenants = await db
        .select()
        .from(schema.tenants)
        .where(eq(schema.tenants.dealId, dealId))
        .limit(1);
      if (tenants.length > 0) {
        const satisfaction = tenants[0].satisfaction ?? 70;
        if (satisfaction >= 80) tenantBonus = 0.02;       // Happy tenant = easier sale
        else if (satisfaction >= 50) tenantBonus = 0.005;  // Neutral
        else if (satisfaction >= 30) tenantBonus = -0.01;  // Unhappy tenant = buyer discount
        else tenantBonus = -0.03;                          // Very unhappy = significant discount
      }
    } catch (e) { /* non-critical */ }
    
    // 5. COSMETIC UPGRADE — renovation boost
    const cosmeticBoost = proFormaOutputs?.cosmeticUpgradeSaleBoost || 0;
    
    // 6. MARKET TREND — multi-month accumulated drift since purchase (smooth, sustained)
    //    The game tracks cumulative priceDriftPct that updates every ~4 weeks based on
    //    market condition. A property held through good months gains; through bad months
    //    loses. This avoids the "one bad month tanks the sale" problem by using the
    //    accumulated trend, not a single-month snapshot.
    const driftAtPurchase = (deal as any).priceDriftAtPurchase ?? 0;
    const currentDrift = gameRun.priceDriftPct ?? 0;
    const trendDelta = (currentDrift - driftAtPurchase) / 100; // e.g. +0.06 = +6%
    // Cap the trend contribution to ±25% so extreme runs don't break balance
    const cappedTrend = Math.max(-0.25, Math.min(0.25, trendDelta));
    
    // 7. BUYER MOOD — small single-month randomness based on current market band
    //    (±2-3% noise; the heavy lifting is now done by the trend above)
    const moodMid = (marketMult.min + marketMult.max) / 2 - 1; // center of band, relative to 1.0
    const moodNoise = (Math.random() - 0.5) * 0.04; // ±2% noise
    const buyerMood = 1 + (moodMid * 0.35) + moodNoise; // dampen mood by 65%, sustain via trend
    
    // === COMBINE ALL FACTORS ===
    // Base: purchase price
    // Additive factors: hold appreciation (organic), diligence, condition, tenant, cosmetic
    // Multiplicative: trend (multi-month market) × buyer mood (current-month noise)
    const totalAdditivePct = holdAppreciation + diligenceBonus + fixedBonus - conditionPenalty + tenantBonus + cosmeticBoost;
    
    // Base sale price before market multipliers
    const baseSalePrice = purchasePrice * (1 + totalAdditivePct);
    
    // Apply market trend (multi-month) then buyer mood (current-month noise)
    let salePrice = Math.round(baseSalePrice * (1 + cappedTrend) * buyerMood);
    
    // Floor: never sell for less than 60% of purchase price
    salePrice = Math.max(salePrice, Math.round(purchasePrice * 0.60));
    
    // Quick-flip penalty: buying and immediately selling (< 3 months) = wholesale discount
    if (monthsHeld <= 2) {
      const quickFlipCap = Math.round(purchasePrice * 0.95); // Lose at least 5% on immediate resale
      salePrice = Math.min(salePrice, quickFlipCap);
    }
    
    const saleMultiplier = salePrice / purchasePrice;
    
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
        rentalRehabActive: false,
        rentalRehabWeeksRemaining: 0,
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
    const isProfitable = saleProfit > 0 && gameRun.weeksRemaining > 0;
    const newProfitableDeals = isProfitable ? gameRun.profitableDeals + 1 : gameRun.profitableDeals;
    const dealLabel = `Rental Exit · ${updatedDeal?.purchasePrice ? `$${Math.round(salePrice / 1000)}k` : 'Sale'}`;
    const streakUpdate = applyStreakAndXpUpdate(gameRun, saleProfit, purchasePrice, dealLabel);
    
    const [updatedGameRun] = await db
      .update(schema.gameRuns)
      .set({
        weeksRemaining: newWeeksRemaining,
        cash: newCash,
        profitableDeals: newProfitableDeals,
        currentStreak: streakUpdate.currentStreak,
        bestStreak: streakUpdate.bestStreak,
        xp: streakUpdate.xp,
        seasonStats: streakUpdate.seasonStats,
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
      throw new Error('Not enough time remaining to sell (need 2 months)');
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
    
    // Calculate sale price using shared flip pricing function (same as completeFlipDeal)
    const rehabBudget = proFormaInputs?.rehabBudget || 0;
    const contingencyPct = proFormaInputs?.contingencyPct || 10;
    
    // Look up diligence for this deal
    const investigations = await db
      .select()
      .from(schema.propertyInvestigations)
      .where(eq(schema.propertyInvestigations.gameRunId, gameRunId));
    const completedDiligence = investigations
      .filter(inv => inv.propertyId === deal.propertyId)
      .map(inv => inv.investigationType);
    const didComps = completedDiligence.includes('appraisal');
    
    const diligenceTypes = ['appraisal', 'contractor_walkthrough', 'inspection', 'title_search'];
    const diligenceCount = diligenceTypes.filter(d => completedDiligence.includes(d)).length;
    
    // Calculate condition penalty from unfixed issues (same as completeFlipDeal)
    const { getRandomizedPropertyIssues } = await import('@shared/propertyIssues');
    const allIssues = getRandomizedPropertyIssues(
      gameRunId, deal.propertyId,
      property.propertyType, property.conditionTag,
      property.waterSource || 'public'
    );
    const rawFixedIssueIds = proFormaInputs?.fixedIssueIds || [];
    const fixedIssueIds = [...new Set(rawFixedIssueIds)].filter((id: string) => allIssues.some(i => i.id === id));
    const undiscoveredIssues = allIssues.filter(issue =>
      !issue.discoveredBy.some(method => completedDiligence.includes(method))
    );
    const discoveredButSkipped = allIssues.filter(issue =>
      issue.discoveredBy.some(method => completedDiligence.includes(method)) &&
      !fixedIssueIds.includes(issue.id)
    );
    const conditionPenalty = (undiscoveredIssues.length * 0.02) + (discoveredButSkipped.length * 0.015);
    const fixedBonus = fixedIssueIds.length > 0 ? Math.min(fixedIssueIds.length * 0.01, 0.05) : 0;
    
    const marketCondition = gameRun.marketCondition || 'good';
    const marketMult = getMarketMultipliers(marketCondition as MarketCondition);
    
    let salePrice = calculateFlipSalePrice({
      purchasePrice,
      rehabBudget,
      finishLevel: proFormaInputs?.finishLevel || 'builder',
      contingencyPct,
      arvMin: property.arvMin,
      arvMax: property.arvMax,
      rehabMax: property.rehabMax,
      playerArvEstimate: proFormaInputs?.arv,
      didComps,
      diligenceCount,
      conditionPenalty,
      fixedBonus,
      marketMult,
    });
    const cosmeticSaleBoost = proFormaOutputs?.cosmeticUpgradeSaleBoost || 0;
    if (cosmeticSaleBoost > 0) {
      salePrice = Math.round(salePrice * (1 + cosmeticSaleBoost / 100));
    }
    const saleMultiplier = salePrice / purchasePrice;
    
    // Net proceeds = sale price minus mortgage payoff (this is what player receives in cash)
    const netProceeds = salePrice - mortgagePayoff;
    
    // Calculate all-in cost for true profit calculation
    const finishCostMult = (proFormaInputs?.finishLevel === 'luxury') ? 1.4 : 1.0;
    const actualRehabSpend = Math.round(rehabBudget * finishCostMult) * (1 + contingencyPct / 100);
    const closingCosts = Math.round(purchasePrice * 0.025);
    const loanFees = proFormaOutputs?.loanOriginationFees || Math.round((proFormaOutputs?.loanAmount || 0) * 0.02);
    const sellingCostsPct = proFormaInputs?.sellingCostsPct || 5;
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
      description: `Sold flip for $${salePrice.toLocaleString()}`,
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
    const isProfitable = saleProfit > 0 && gameRun.weeksRemaining > 0;
    const newProfitableDeals = isProfitable ? gameRun.profitableDeals + 1 : gameRun.profitableDeals;
    const dealLabel = `Flip · $${Math.round(saleProfit / 1000)}k profit`;
    const streakUpdate = applyStreakAndXpUpdate(gameRun, saleProfit, purchasePrice, dealLabel);
    
    const [updatedGameRun] = await db
      .update(schema.gameRuns)
      .set({
        weeksRemaining: newWeeksRemaining,
        cash: newCash,
        profitableDeals: newProfitableDeals,
        currentStreak: streakUpdate.currentStreak,
        bestStreak: streakUpdate.bestStreak,
        xp: streakUpdate.xp,
        seasonStats: streakUpdate.seasonStats,
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
      throw new Error(`Must hold property for ${SEASONING_WEEKS} months before refinancing (${SEASONING_WEEKS - weeksHeld} months remaining)`);
    }
    
    // Check refinance cooldown (must wait 4 weeks between refinances)
    if (deal.lastRefinanceWeek !== null && deal.lastRefinanceWeek !== undefined) {
      const weeksSinceLastRefi = currentWeek - deal.lastRefinanceWeek;
      if (weeksSinceLastRefi < REFINANCE_COOLDOWN_WEEKS) {
        throw new Error(`Must wait ${REFINANCE_COOLDOWN_WEEKS - weeksSinceLastRefi} more month(s) before refinancing again`);
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
    const monthsHeld = weeksHeld;
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

  async createLedgerEntriesOnly(
    gameRunId: number,
    entries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[],
    currentCash: number
  ): Promise<{ entries: LedgerEntry[], newCash: number }> {
    let runningBalance = Math.round(currentCash);
    const createdEntries: LedgerEntry[] = [];

    for (const entry of entries) {
      const roundedAmount = Math.round(entry.amount);
      if (entry.direction === 'debit') {
        runningBalance -= roundedAmount;
      } else {
        runningBalance += roundedAmount;
      }

      const [ledgerEntry] = await db
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

    return { entries: createdEntries, newCash: runningBalance };
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

  async deletePlayer(playerId: number): Promise<void> {
    await db.delete(schema.playerTrophies).where(eq(schema.playerTrophies.playerId, playerId));
    await db.delete(schema.hallOfFamePlayers).where(eq(schema.hallOfFamePlayers.id, playerId));
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

  async deleteTenant(id: number): Promise<void> {
    await db.delete(schema.tenants).where(eq(schema.tenants.id, id));
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

  // Achievement methods
  async getAchievements(gameRunId: number): Promise<Achievement[]> {
    return await db
      .select()
      .from(schema.achievements)
      .where(eq(schema.achievements.gameRunId, gameRunId))
      .orderBy(desc(schema.achievements.unlockedAt));
  }

  async unlockAchievement(gameRunId: number, achievementId: string, metadata?: any): Promise<Achievement> {
    const [achievement] = await db
      .insert(schema.achievements)
      .values({
        gameRunId,
        achievementId,
        metadata: metadata || null,
      })
      .returning();
    return achievement;
  }

  async hasAchievement(gameRunId: number, achievementId: string): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(schema.achievements)
      .where(and(
        eq(schema.achievements.gameRunId, gameRunId),
        eq(schema.achievements.achievementId, achievementId)
      ))
      .limit(1);
    return !!existing;
  }
}

export const storage = new DBStorage();
