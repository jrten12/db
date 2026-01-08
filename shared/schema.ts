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
});

export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  gameRunId: integer("game_run_id").notNull().references(() => gameRuns.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  strategy: text("strategy").notNull(),
  proFormaInputs: jsonb("pro_forma_inputs").notNull(),
  proFormaOutputs: jsonb("pro_forma_outputs").notNull(),
  actualProfit: integer("actual_profit"),
  status: text("status").notNull().default("planned"),
  weeksSpent: integer("weeks_spent"),
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

export type GameRun = typeof gameRuns.$inferSelect;
export type InsertGameRun = z.infer<typeof insertGameRunSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
