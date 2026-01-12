import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const gameRuns = pgTable("game_runs", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  difficulty: text("difficulty").notNull().default("apprentice"),
  cash: integer("cash").notNull().default(30000),
  weeksRemaining: integer("weeks_remaining").notNull().default(7),
  currentWeek: integer("current_week").notNull().default(0), // Track progression through game
  profitableDeals: integer("profitable_deals").notNull().default(0),
  goalDeals: integer("goal_deals").notNull().default(3),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  sizeSqft: integer("size_sqft").notNull(),
  neighborhood: text("neighborhood").notNull(),
  rentMin: integer("rent_min").notNull(),
  rentMax: integer("rent_max").notNull(),
  arvMin: integer("arv_min").notNull(),
  arvMax: integer("arv_max").notNull(),
  conditionTag: text("condition_tag").notNull(),
  photoUrl: text("photo_url"),
  rehabMin: integer("rehab_min").notNull(),
  rehabMax: integer("rehab_max").notNull(),
  timelineMin: integer("timeline_min").notNull(),
  timelineMax: integer("timeline_max").notNull(),
  offMarketRate: real("off_market_rate").notNull(),
  viabilityProfile: text("viability_profile").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  issuesProfile: jsonb("issues_profile"),
  locationType: text("location_type").notNull().default("suburban"),
  propertyType: text("property_type").notNull().default("house"), // house, apartment, condo, townhouse, duplex
});

export const propertyInvestigations = pgTable("property_investigations", {
  id: serial("id").primaryKey(),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  investigationType: text("investigation_type").notNull(),
  revealedData: jsonb("revealed_data"),
  cost: integer("cost").notNull(),
  weeksUsed: integer("weeks_used").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  strategy: text("strategy").notNull(), // 'flip' | 'rental'
  proFormaInputs: jsonb("pro_forma_inputs").notNull(),
  proFormaOutputs: jsonb("pro_forma_outputs").notNull(),
  actualProfit: integer("actual_profit"),
  status: text("status").notNull().default("planned"), // 'planned' | 'in_rehab' | 'leasing' | 'active_rental' | 'listing' | 'completed' | 'sold_rental'
  weeksSpent: integer("weeks_spent"),
  weeksUntilCompletion: integer("weeks_until_completion"), // For flips in rehab
  weeklyIncome: integer("weekly_income"), // For active rentals (cash flow per week)
  lastIncomePaymentWeek: integer("last_income_payment_week"), // Track when last rent was paid
  purchasePrice: integer("purchase_price"), // Original purchase price (for calculating sale proceeds)
  salePrice: integer("sale_price"), // Final sale price when rental is sold
  saleMultiplier: real("sale_multiplier"), // The random multiplier used (0.90 to 1.15)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertGameRunSchema = createInsertSchema(gameRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertPropertyInvestigationSchema = createInsertSchema(propertyInvestigations).omit({
  id: true,
  completedAt: true,
});

export type GameRun = typeof gameRuns.$inferSelect;
export type InsertGameRun = z.infer<typeof insertGameRunSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type PropertyInvestigation = typeof propertyInvestigations.$inferSelect;
export type InsertPropertyInvestigation = z.infer<typeof insertPropertyInvestigationSchema>;

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  direction: text("direction").notNull(), // 'debit' | 'credit'
  category: text("category").notNull(), // 'starting_balance' | 'due_diligence' | 'down_payment' | 'closing_cost' | 'loan_fee' | 'holding_cost' | 'income' | 'rehab'
  amount: integer("amount").notNull(), // in cents for precision, positive value
  balanceAfter: integer("balance_after").notNull(),
  description: text("description").notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  dealId: integer("deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({
  id: true,
  createdAt: true,
});

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;

export const curveballEvents = pgTable("curveball_events", {
  id: serial("id").primaryKey(),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  dealId: integer("deal_id").references(() => deals.id),
  curveballId: text("curveball_id").notNull(), // ID from curveballs.ts
  name: text("name").notNull(),
  type: text("type").notNull(), // 'positive' | 'negative' | 'neutral'
  description: text("description").notNull(),
  cashImpact: integer("cash_impact"), // Positive = gain, Negative = cost
  timeImpact: integer("time_impact"), // In weeks
  emoji: text("emoji"),
  gameWeek: integer("game_week").notNull(), // When it occurred
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCurveballEventSchema = createInsertSchema(curveballEvents).omit({
  id: true,
  createdAt: true,
});

export type CurveballEvent = typeof curveballEvents.$inferSelect;
export type InsertCurveballEvent = z.infer<typeof insertCurveballEventSchema>;

// Hall of Fame - Persistent player records that survive game resets
export const hallOfFamePlayers = pgTable("hall_of_fame_players", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalDealsCompleted: integer("total_deals_completed").notNull().default(0),
  totalProfitEarned: integer("total_profit_earned").notNull().default(0),
  bestGameProfit: integer("best_game_profit").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastPlayedAt: timestamp("last_played_at").defaultNow().notNull(),
});

// Trophy definitions - what trophies exist and how to earn them
export const trophyTypes = [
  { id: 'first_deal', name: 'First Blood', description: 'Complete your first deal', icon: 'trophy', tier: 'bronze' },
  { id: 'profitable_deal', name: 'In the Black', description: 'Complete a profitable deal', icon: 'dollar-sign', tier: 'bronze' },
  { id: 'flip_master', name: 'Flip Master', description: 'Complete 5 successful flips', icon: 'hammer', tier: 'silver' },
  { id: 'landlord', name: 'Landlord', description: 'Own 3 rental properties in one game', icon: 'home', tier: 'silver' },
  { id: 'due_diligence', name: 'Detective', description: 'Complete all due diligence on 5 properties', icon: 'search', tier: 'bronze' },
  { id: 'big_spender', name: 'Big Spender', description: 'Spend over $500,000 on properties', icon: 'credit-card', tier: 'silver' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Win a game with 20+ weeks remaining', icon: 'zap', tier: 'gold' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn $500,000 total profit across all games', icon: 'gem', tier: 'gold' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Win without any failed deals', icon: 'star', tier: 'gold' },
  { id: 'survivor', name: 'Survivor', description: 'Win with less than 2 weeks remaining', icon: 'clock', tier: 'silver' },
  { id: 'urban_expert', name: 'Urban Expert', description: 'Complete 5 deals in urban areas', icon: 'building', tier: 'silver' },
] as const;

export type TrophyId = typeof trophyTypes[number]['id'];

// Player trophies - earned achievements
export const playerTrophies = pgTable("player_trophies", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull().references(() => hallOfFamePlayers.id),
  trophyId: text("trophy_id").notNull(), // References trophyTypes
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  gameRunId: integer("game_run_id").references(() => gameRuns.id), // Which game run earned it
});

export const insertHallOfFamePlayerSchema = createInsertSchema(hallOfFamePlayers).omit({
  id: true,
  createdAt: true,
  lastPlayedAt: true,
});

export const insertPlayerTrophySchema = createInsertSchema(playerTrophies).omit({
  id: true,
  earnedAt: true,
});

export type HallOfFamePlayer = typeof hallOfFamePlayers.$inferSelect;
export type InsertHallOfFamePlayer = z.infer<typeof insertHallOfFamePlayerSchema>;

export type PlayerTrophy = typeof playerTrophies.$inferSelect;
export type InsertPlayerTrophy = z.infer<typeof insertPlayerTrophySchema>;
