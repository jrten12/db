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

// Market conditions: 5 levels from terrible to excellent
// Changes monthly with gradual shifts (no extreme jumps)
// 65% of the time should be "good" or "excellent"
export type MarketCondition = 'terrible' | 'poor' | 'neutral' | 'good' | 'excellent';
export const MARKET_CONDITIONS: MarketCondition[] = ['terrible', 'poor', 'neutral', 'good', 'excellent'];

export const gameRuns = pgTable("game_runs", {
  id: serial("id").primaryKey(),
  playerName: text("player_name").notNull(),
  difficulty: text("difficulty").notNull().default("apprentice"),
  cash: integer("cash").notNull().default(75000),
  weeksRemaining: integer("weeks_remaining").notNull().default(52),
  currentWeek: integer("current_week").notNull().default(0), // Track progression through game
  profitableDeals: integer("profitable_deals").notNull().default(0),
  goalDeals: integer("goal_deals").notNull().default(3),
  status: text("status").notNull().default("active"),
  marketCondition: text("market_condition").notNull().default("good"), // Current market: terrible, poor, neutral, good, excellent
  lastMarketChangeWeek: integer("last_market_change_week").notNull().default(0), // Week when market last changed
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
  postRehabRentMin: integer("post_rehab_rent_min"), // Rent potential after improvements
  postRehabRentMax: integer("post_rehab_rent_max"), // Rent potential after improvements
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
  bedrooms: integer("bedrooms").notNull().default(3),
  bathrooms: real("bathrooms").notNull().default(1.5), // 1, 1.5, 2, 2.5, etc.
  waterSource: text("water_source").notNull().default("public"), // public (city water/sewer) or well (well/septic)
  heatType: text("heat_type").notNull().default("gas"), // gas, electric, oil, heat_pump
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
  status: text("status").notNull().default("planned"), // 'planned' | 'in_rehab' | 'ready_to_list' | 'leasing' | 'active_rental' | 'listing' | 'completed' | 'sold_rental'
  weeksSpent: integer("weeks_spent"),
  weeksUntilCompletion: integer("weeks_until_completion"), // For flips in rehab
  weeklyIncome: integer("weekly_income"), // For active rentals (cash flow per week)
  lastIncomePaymentWeek: integer("last_income_payment_week"), // Track when last rent was paid
  purchasePrice: integer("purchase_price"), // Original purchase price (for calculating sale proceeds)
  salePrice: integer("sale_price"), // Final sale price when rental is sold
  saleMultiplier: real("sale_multiplier"), // The random multiplier used (0.90 to 1.15)
  // Loan tracking fields
  originalLoanAmount: integer("original_loan_amount"), // Initial loan amount at purchase
  loanInterestRate: real("loan_interest_rate"), // Annual interest rate (e.g., 6.5 for 6.5%)
  loanTermMonths: integer("loan_term_months").default(360), // Loan term in months (default 30-year)
  // Refinancing fields
  purchaseWeek: integer("purchase_week"), // Week when rental was purchased (for seasoning period)
  refinanceCount: integer("refinance_count").default(0), // How many times this property has been refinanced
  currentLoanBalance: integer("current_loan_balance"), // Current loan balance (updated after refinance/payments)
  lastRefinanceWeek: integer("last_refinance_week"), // Week of last refinance
  totalPrincipalPaid: integer("total_principal_paid").default(0), // Cumulative principal paid
  totalInterestPaid: integer("total_interest_paid").default(0), // Cumulative interest paid
  recentCurveballIds: jsonb("recent_curveball_ids").$type<string[]>().default([]), // Last 4 curveball IDs to prevent repetition
  contractorWalkthroughCompleted: boolean("contractor_walkthrough_completed").default(false), // Whether contractor walkthrough was done post-purchase
  contractorWalkthroughData: jsonb("contractor_walkthrough_data"), // Repair items discovered during walkthrough
  // Rental rehab tracking (post-purchase renovations for owned rentals)
  rentalRehabActive: boolean("rental_rehab_active").default(false), // Whether rehab is in progress
  rentalRehabWeeksRemaining: integer("rental_rehab_weeks_remaining"), // Weeks until rehab completes
  rentalRehabBaseWeeks: integer("rental_rehab_base_weeks"), // Original estimate before variance
  rentalRehabCostBase: integer("rental_rehab_cost_base"), // Original estimate
  rentalRehabCostActual: integer("rental_rehab_cost_actual"), // Final cost after overruns
  rentalRehabVariancePct: integer("rental_rehab_variance_pct"), // Timeline variance applied (+/- %)
  rentalRehabStartWeek: integer("rental_rehab_start_week"), // Week when rehab started
  rentalRehabItems: jsonb("rental_rehab_items"), // Items being repaired
  tenantDisplaced: boolean("tenant_displaced").default(false), // Tenant moved out for rehab
  tenantBreakFee: integer("tenant_break_fee"), // Break fee paid to tenant
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
  category: text("category").notNull(), // 'starting_balance' | 'due_diligence' | 'down_payment' | 'closing_cost' | 'loan_fee' | 'holding_cost' | 'income' | 'rehab' | 'expense'
  amount: integer("amount").notNull(), // in cents for precision, positive value
  balanceAfter: integer("balance_after").notNull(),
  description: text("description").notNull(),
  propertyId: integer("property_id").references(() => properties.id),
  dealId: integer("deal_id").references(() => deals.id),
  gameWeek: integer("game_week").notNull().default(1), // When the transaction occurred
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
  { id: 'due_diligence', name: 'Detective', description: 'Complete all due diligence on 5 properties', icon: 'search', tier: 'bronze' },
  { id: 'flip_master', name: 'Flip Master', description: 'Complete 5 successful flips', icon: 'hammer', tier: 'silver' },
  { id: 'landlord', name: 'Landlord', description: 'Own 3 rental properties in one game', icon: 'home', tier: 'silver' },
  { id: 'big_spender', name: 'Big Spender', description: 'Spend over $750,000 on properties', icon: 'credit-card', tier: 'silver' },
  { id: 'survivor', name: 'Survivor', description: 'Win with less than 2 weeks remaining', icon: 'clock', tier: 'silver' },
  { id: 'urban_expert', name: 'Urban Expert', description: 'Complete 5 deals in urban areas', icon: 'building', tier: 'silver' },
  { id: 'winner', name: 'Champion', description: 'Win a game', icon: 'award', tier: 'gold' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Win a game with 20+ weeks remaining', icon: 'zap', tier: 'gold' },
  { id: 'millionaire', name: 'Millionaire', description: 'Earn $750,000 total profit across all games', icon: 'gem', tier: 'gold' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Win without any failed deals', icon: 'star', tier: 'gold' },
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

// Tenants for rental properties
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").notNull().references(() => deals.id),
  name: text("name").notNull(),
  personalityType: text("personality_type").notNull(), // Internal type, not shown to player
  portraitUrl: text("portrait_url"), // Generated via GPT image
  speechPatterns: jsonb("speech_patterns").notNull(), // Array of possible messages
  lastContactWeek: integer("last_contact_week"), // Prevent spam
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

// Coupons/promo codes for free months and cash
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  cashAmount: integer("cash_amount").notNull().default(0),
  monthsAmount: integer("months_amount").notNull().default(0),
  usageLimit: integer("usage_limit"), // null = unlimited
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;

// Achievements/Awards system
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  achievementId: text("achievement_id").notNull(), // e.g., 'first_25k', 'the_landlord'
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  metadata: jsonb("metadata"), // Extra data about the achievement (e.g., ROI value, deal details)
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
