import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameRunSchema, insertDealSchema, insertPropertyInvestigationSchema, insertLedgerEntrySchema, insertTenantSchema, trophyTypes, type Deal, type GameRun, type Property } from "@shared/schema";
import { z } from "zod";
import * as gameMechanics from "./gameMechanics";
import { getUnfixedIssues } from "./maintenanceMechanics";
import { dealLimiter, ledgerLimiter, gameActionLimiter, authLimiter, purchaseLimiter } from "./rateLimiter";
import OpenAI from "openai";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";

const consumedCheckoutSessions = new Set<string>();

const PREMIUM_SKU_MAP: Record<string, { cash: number; weeks: number }> = {
  'cash_small': { cash: 50000, weeks: 0 },
  'cash_medium': { cash: 150000, weeks: 0 },
  'cash_large': { cash: 300000, weeks: 0 },
  'weeks_small': { cash: 0, weeks: 40 },
  'weeks_medium': { cash: 0, weeks: 100 },
  'bundle_ultimate': { cash: 200000, weeks: 80 },
};

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminKey = req.headers['x-admin-key'] as string;
  const expectedKey = process.env.ADMIN_KEY;
  if (!expectedKey || adminKey !== expectedKey) {
    res.status(403).json({ error: 'Forbidden: admin access required' });
    return;
  }
  next();
}

function requirePremiumEnabled(_req: Request, res: Response, next: NextFunction) {
  if (process.env.ENABLE_PREMIUM_PURCHASES !== 'true') {
    res.status(403).json({ error: 'Premium purchases are disabled' });
    return;
  }
  next();
}

function requireAdminToolsEnabled(_req: Request, res: Response, next: NextFunction) {
  if (process.env.ENABLE_ADMIN_TOOLS !== 'true') {
    res.status(403).json({ error: 'Admin tools are disabled' });
    return;
  }
  next();
}

// Calculate refinance options based on player's financial situation
async function calculateRefinanceOptions(deal: Deal, gameRun: GameRun, allDeals: Deal[], property: Property) {
  const SEASONING_WEEKS = 8;
  const REFINANCE_COOLDOWN_WEEKS = 4; // Must wait 4 weeks between refinances
  const BASE_FEE_PCT = 0.02; // 2% base refinance fees
  
  // Check seasoning period (for first refinance only)
  const purchaseWeek = deal.purchaseWeek ?? 0;
  const currentWeek = gameRun.currentWeek;
  const weeksHeld = currentWeek - purchaseWeek;
  
  if (weeksHeld < SEASONING_WEEKS) {
    return {
      eligible: false,
      weeksUntilEligible: SEASONING_WEEKS - weeksHeld,
      reason: `Must hold property for ${SEASONING_WEEKS} months before refinancing`,
    };
  }
  
  // Check refinance cooldown (must wait 4 weeks between refinances)
  if (deal.lastRefinanceWeek !== null && deal.lastRefinanceWeek !== undefined) {
    const weeksSinceLastRefi = currentWeek - deal.lastRefinanceWeek;
    if (weeksSinceLastRefi < REFINANCE_COOLDOWN_WEEKS) {
      return {
        eligible: false,
        weeksUntilEligible: REFINANCE_COOLDOWN_WEEKS - weeksSinceLastRefi,
        reason: `Must wait ${REFINANCE_COOLDOWN_WEEKS - weeksSinceLastRefi} more month(s) before refinancing again`,
      };
    }
  }
  
  // Market-correlated appraisal — consistent when modal reopens, tied to weather
  const liveListing = gameMechanics.applyMarketToListing(property, gameRun.marketCondition);
  const totalAppreciation = gameMechanics.calculateMarketAppreciation({
    weeksHeld,
    locationType: property.locationType,
    marketCondition: gameRun.marketCondition,
  });
  const currentMarketValue = Math.round(liveListing.price * totalAppreciation);
  
  // Get current loan balance
  const proFormaOutputs = deal.proFormaOutputs as any;
  const currentLoanBalance = deal.currentLoanBalance ?? proFormaOutputs?.loanAmount ?? 0;
  
  // Calculate equity
  const currentEquity = currentMarketValue - currentLoanBalance;
  const equityPercent = (currentEquity / currentMarketValue) * 100;
  
  // Calculate player's debt-to-income and cash reserves for rate determination
  let totalMonthlyDebt = 0;
  let totalMonthlyIncome = 0;
  
  for (const d of allDeals) {
    if (d.status === 'active_rental') {
      const outputs = d.proFormaOutputs as any;
      totalMonthlyDebt += outputs?.monthlyDebtService || 0;
      totalMonthlyIncome += outputs?.monthlyGrossRent || 0;
    }
  }
  
  const dti = totalMonthlyIncome > 0 ? (totalMonthlyDebt / totalMonthlyIncome) * 100 : 100;
  const cashReserves = gameRun.cash;
  
  // Calculate variable rate based on player's financials
  // Base rate: 7% fixed - variations come from player's financial situation
  const baseRate = 7.0;
  
  // DTI adjustment: higher debt = higher rate
  const dtiAdjustment = dti > 50 ? (dti - 50) * 0.03 : 0; // +0.03% per point above 50% DTI
  
  // Cash reserves adjustment: more cash = lower rate
  const reserveMonths = cashReserves / (totalMonthlyDebt || 1000);
  const reserveAdjustment = reserveMonths > 6 ? -0.25 : (reserveMonths < 3 ? 0.5 : 0);
  
  // Equity adjustment: more equity = lower rate
  const equityAdjustment = equityPercent > 40 ? -0.25 : (equityPercent < 25 ? 0.5 : 0);
  
  const finalRate = Math.max(5.5, Math.min(12, baseRate + dtiAdjustment + reserveAdjustment + equityAdjustment));
  
  // Max LTV is always 90% - higher LTV just means higher interest rate
  // All players can leverage up to 90% if they choose
  const maxLtv = 90;
  
  // Min LTV should be enough to cover current loan
  const minLtvToCoverLoan = Math.ceil((currentLoanBalance / currentMarketValue) * 100) + 5;
  const minLtv = Math.max(minLtvToCoverLoan, 50);
  
  // Calculate cash out at different LTV levels
  const ltvOptions = [];
  for (let ltv = minLtv; ltv <= maxLtv; ltv += 5) {
    const newLoanAmount = Math.round(currentMarketValue * (ltv / 100));
    const refinanceFees = Math.round(newLoanAmount * BASE_FEE_PCT);
    const cashOut = newLoanAmount - currentLoanBalance - refinanceFees;
    
    if (cashOut > 0) {
      ltvOptions.push({
        ltv,
        newLoanAmount,
        cashOut,
        refinanceFees,
        monthlyPayment: Math.round(calculateMonthlyPayment(newLoanAmount, finalRate, 360)),
      });
    }
  }
  
  return {
    eligible: true,
    currentMarketValue,
    currentLoanBalance,
    currentEquity,
    equityPercent: Math.round(equityPercent),
    interestRate: Math.round(finalRate * 100) / 100,
    refinanceFeePct: BASE_FEE_PCT * 100,
    minLtv,
    maxLtv,
    ltvOptions,
    playerMetrics: {
      dti: Math.round(dti),
      cashReserves,
      reserveMonths: Math.round(reserveMonths * 10) / 10,
    },
  };
}

// Helper to calculate monthly mortgage payment
function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / termMonths;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize database with starter properties (no-op if already seeded).
  // This MUST run before serving requests because /api/properties needs rows.
  await storage.seedProperties();

  // All remaining migrations are idempotent and can run in the background
  // so the HTTP server starts accepting requests immediately. Property
  // queries against the existing DB rows remain valid while these finish.
  (async () => {
    try {
      await storage.ensureMetroColumns();
      await storage.backfillPropertyMetroIds();
      await storage.seedAtlantaProperties();
      await storage.addNewUrbanProperties();
      await storage.addNewLuxuryProperties();
      await storage.updatePropertyLocationTypes();
      await storage.backfillPropertyCharacteristics();
      await storage.refreshPropertyPrices();
      console.log("Property prices refreshed to new balanced economy values");
    } catch (err) {
      console.error("Background property migrations failed:", err);
    }
  })();

  // Get all properties (optional ?metro=philadelphia|atlanta filter)
  app.get("/api/properties", async (req, res) => {
    try {
      // Prevent browser caching to ensure fresh property list
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      const metroParam = typeof req.query.metro === 'string' ? req.query.metro : undefined;
      const properties = metroParam
        ? await storage.getPropertiesByMetro(metroParam)
        : await storage.getAllProperties();
      console.log(`Returning ${properties.length} properties${metroParam ? ` (metro=${metroParam})` : ''}`);
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  // List available metros for game start
  app.get("/api/metros", async (_req, res) => {
    try {
      const { METRO_LIST } = await import("@shared/metros");
      res.json(METRO_LIST);
    } catch (error) {
      console.error("Error fetching metros:", error);
      res.status(500).json({ error: "Failed to fetch metros" });
    }
  });

  // Admin: Manually refresh property prices (for debugging)
  // BUG-003: Gated behind admin auth + ENABLE_ADMIN_TOOLS flag
  app.post("/api/admin/refresh-prices", requireAdminToolsEnabled, requireAdmin, async (req, res) => {
    try {
      const result = await storage.refreshPropertyPrices();
      res.json({ success: true, message: `Updated ${result.updated} properties`, properties: result.properties });
    } catch (error) {
      console.error("Error refreshing property prices:", error);
      res.status(500).json({ error: "Failed to refresh property prices" });
    }
  });

  // Create new game run
  app.post("/api/game-runs", async (req, res) => {
    try {
      const validated = insertGameRunSchema.parse(req.body);
      const { normalizeMetroId, METROS } = await import("@shared/metros");
      const metroId = normalizeMetroId(validated.metroId);
      // BAL-003: Randomize starting market — Atlanta (Sun Belt) biases slightly toward growth
      let marketCondition = gameMechanics.getRandomStartingMarket();
      if (metroId === 'atlanta' && Math.random() < 0.45) {
        marketCondition = METROS.atlanta.defaultMarketCondition;
      }
      const gameRun = await storage.createGameRun({
        ...validated,
        metroId,
        marketCondition,
      });
      res.json(gameRun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating game run:", error);
        res.status(500).json({ error: "Failed to create game run" });
      }
    }
  });

  // Get active game run
  app.get("/api/game-runs/active", async (req, res) => {
    try {
      const gameRun = await storage.getActiveGameRun();
      res.json(gameRun || null);
    } catch (error) {
      console.error("Error fetching active game run:", error);
      res.status(500).json({ error: "Failed to fetch active game run" });
    }
  });

  // Get active game by player name
  app.get("/api/game-runs/player/:playerName", async (req, res) => {
    try {
      const playerName = decodeURIComponent(req.params.playerName);
      const gameRun = await storage.getActiveGameByPlayer(playerName);
      res.json(gameRun || null);
    } catch (error) {
      console.error("Error fetching game by player:", error);
      res.status(500).json({ error: "Failed to fetch game by player" });
    }
  });

  // Delete game run (for starting new game)
  app.delete("/api/game-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGameRun(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting game run:", error);
      res.status(500).json({ error: "Failed to delete game run" });
    }
  });

  // Get specific game run
  app.get("/api/game-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const gameRun = await storage.getGameRun(id);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }
      res.json(gameRun);
    } catch (error) {
      console.error("Error fetching game run:", error);
      res.status(500).json({ error: "Failed to fetch game run" });
    }
  });

  // Update game run
  app.patch("/api/game-runs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertGameRunSchema.partial().parse(req.body);
      const gameRun = await storage.updateGameRun(id, updates);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }
      res.json(gameRun);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error updating game run:", error);
        res.status(500).json({ error: "Failed to update game run" });
      }
    }
  });

  // Create deal (rate limited - sensitive financial operation)
  app.post("/api/deals", dealLimiter, async (req, res) => {
    try {
      const validated = insertDealSchema.parse(req.body);
      
      // Check if property is already sold in this game run
      const existingDeals = await storage.getDealsByGameRun(validated.gameRunId);
      const activeDeal = existingDeals.find(
        d => d.propertyId === validated.propertyId && d.status !== 'planned'
      );
      if (activeDeal) {
        res.status(400).json({ error: "This property has already been purchased in this game" });
        return;
      }
      
      const deal = await storage.createDeal(validated);
      res.json(deal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating deal:", error);
        res.status(500).json({ error: "Failed to create deal" });
      }
    }
  });

  // Get deals for game run
  app.get("/api/game-runs/:id/deals", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const deals = await storage.getDealsByGameRun(gameRunId);
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  // Create property investigation
  app.post("/api/investigations", async (req, res) => {
    try {
      const validated = insertPropertyInvestigationSchema.parse(req.body);
      const investigation = await storage.createPropertyInvestigation(validated);
      res.json(investigation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        console.error("Error creating investigation:", error);
        res.status(500).json({ error: "Failed to create investigation" });
      }
    }
  });

  // Get investigations for game run
  app.get("/api/game-runs/:id/investigations", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const investigations = await storage.getPropertyInvestigations(gameRunId);
      res.json(investigations);
    } catch (error) {
      console.error("Error fetching investigations:", error);
      res.status(500).json({ error: "Failed to fetch investigations" });
    }
  });

  // Get ledger for game run
  app.get("/api/game-runs/:id/ledger", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const ledger = await storage.getLedgerByGameRun(gameRunId);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      res.status(500).json({ error: "Failed to fetch ledger" });
    }
  });

  // Create ledger entries with cash update (rate limited - financial operation)
  app.post("/api/game-runs/:id/ledger", ledgerLimiter, async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { entries, currentCash, gameWeek } = req.body as {
        entries: Array<{ direction: string; category: string; amount: number; description: string; propertyId?: number; dealId?: number; gameWeek?: number }>;
        currentCash: number;
        gameWeek?: number;
      };
      
      // Get current game week from game run if not provided
      const gameRun = await storage.getGameRun(gameRunId);
      const currentGameWeek = gameWeek ?? gameRun?.currentWeek ?? 1;
      
      // Add gameWeek to each entry if not already present
      const entriesWithWeek = entries.map(e => ({
        ...e,
        gameWeek: e.gameWeek ?? currentGameWeek,
      }));

      // Calculate total debits to check if player can afford this
      const totalDebits = entriesWithWeek
        .filter(e => e.direction === 'debit')
        .reduce((sum, e) => sum + e.amount, 0);
      
      // Get actual current cash from database to prevent stale data issues
      const actualCash = gameRun?.cash ?? currentCash;
      
      // Check if this is a property purchase transaction
      // Purchase transactions have categories: down_payment, closing_cost, loan_fee
      const purchaseCategories = ['down_payment', 'closing_cost', 'loan_fee'];
      const isPurchaseTransaction = entriesWithWeek.some(e => purchaseCategories.includes(e.category));
      
      if (isPurchaseTransaction) {
        // First purchase: block if insufficient funds (can't go bankrupt on first deal)
        // Subsequent purchases: allow negative cash (bankruptcy possible)
        // 
        // Logic: Count all deals in the game that have been successfully funded.
        // A deal is "funded" if it has status indicating purchase completed (active_rental, in_rehab, completed, sold_rental)
        // If there are 0 or 1 funded deals, this is the first purchase being finalized - block overdraft.
        // If there are 2+ funded deals, player already has property equity - bankruptcy is allowed.
        const existingDeals = await storage.getDealsByGameRun(gameRunId);
        const fundedDealCount = existingDeals.filter(d => 
          ['active_rental', 'in_rehab', 'completed', 'sold_rental'].includes(d.status)
        ).length;
        
        // 0 funded deals means this is the very first purchase
        // Block overdraft only for the inaugural acquisition
        const isFirstPurchase = fundedDealCount === 0;
        
        if (isFirstPurchase && totalDebits > actualCash) {
          res.status(400).json({ 
            error: "Insufficient funds", 
            message: `You need $${totalDebits.toLocaleString()} but only have $${actualCash.toLocaleString()} available.`
          });
          return;
        }
      }

      const result = await storage.createLedgerEntriesWithCashUpdate(gameRunId, entriesWithWeek, actualCash);
      res.json(result);
    } catch (error) {
      console.error("Error creating ledger entries:", error);
      res.status(500).json({ error: "Failed to create ledger entries" });
    }
  });

  // Restore game run data from saved game
  app.post("/api/game-runs/:id/restore", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { deals, investigations, ledgerEntries } = req.body as {
        deals: any[];
        investigations: any[];
        ledgerEntries: any[];
      };

      // Strip out IDs and timestamps from saved data before restoring
      const cleanDeals = deals.map(d => ({
        propertyId: d.propertyId,
        strategy: d.strategy,
        proFormaInputs: d.proFormaInputs,
        proFormaOutputs: d.proFormaOutputs,
        actualProfit: d.actualProfit,
        status: d.status,
        weeksSpent: d.weeksSpent,
        weeksUntilCompletion: d.weeksUntilCompletion,
        weeklyIncome: d.weeklyIncome,
        lastIncomePaymentWeek: d.lastIncomePaymentWeek,
        firstIncomePaymentWeek: d.firstIncomePaymentWeek,
      }));

      const cleanInvestigations = investigations.map(i => ({
        propertyId: i.propertyId,
        investigationType: i.investigationType,
        revealedData: i.revealedData,
        cost: i.cost,
        weeksUsed: i.weeksUsed,
      }));

      const cleanLedgerEntries = ledgerEntries.map(l => ({
        direction: l.direction,
        category: l.category,
        amount: l.amount,
        description: l.description,
        balanceAfter: l.balanceAfter,
        propertyId: l.propertyId,
        dealId: l.dealId,
      }));

      const result = await storage.restoreGameRunData(
        gameRunId,
        cleanDeals,
        cleanInvestigations,
        cleanLedgerEntries
      );

      res.json(result);
    } catch (error) {
      console.error("Error restoring game run data:", error);
      res.status(500).json({ error: "Failed to restore game run data" });
    }
  });

  // Advance game by one week (rate limited - game action)
  app.post("/api/game-runs/:id/advance-week", gameActionLimiter, async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);

      // Season gate: block advancing past the current allocation of weeks.
      // Player must watch a sponsor message to unlock the next 52-week season.
      const currentRun = await storage.getGameRun(gameRunId);
      if (!currentRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }
      if (currentRun.weeksRemaining <= 0) {
        // Hand the client everything it needs to render the Season Recap
        // (no second round-trip required).
        res.status(409).json({
          code: 'season_ended',
          message: 'Season ended — unlock the next season to continue.',
          seasonsUnlocked: currentRun.seasonsUnlocked,
          currentWeek: currentRun.currentWeek,
          seasonStats: currentRun.seasonStats,
          currentStreak: currentRun.currentStreak,
          bestStreak: currentRun.bestStreak,
          xp: currentRun.xp,
          cash: currentRun.cash,
          profitableDeals: currentRun.profitableDeals,
        });
        return;
      }

      const result = await gameMechanics.advanceGameWeek(gameRunId);
      res.json(result);
    } catch (error: any) {
      console.error("Error advancing game week:", error);
      res.status(500).json({ error: error.message || "Failed to advance game week" });
    }
  });

  // Unlock the next 52-week season after the player watches a rewarded video.
  // The client guarantees the ad has completed before calling this endpoint.
  // Awards a small cash bonus to make the unlock feel rewarding ("season bonus").
  // Per-game-run in-flight lock so a double-click (or double-tap) on the
  // sponsor reward can't grant the season bonus twice.
  const unlockInFlight = new Set<number>();
  app.post("/api/game-runs/:id/unlock-season", gameActionLimiter, async (req, res) => {
    const gameRunId = parseInt(req.params.id);
    if (unlockInFlight.has(gameRunId)) {
      res.status(409).json({ error: "Season unlock already in progress." });
      return;
    }
    unlockInFlight.add(gameRunId);
    try {
      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      // Only allow unlocking when the current season is actually exhausted.
      // This is the primary idempotency guard — after a successful unlock,
      // weeksRemaining jumps to 52 so a duplicate request short-circuits here.
      if (gameRun.weeksRemaining > 0) {
        res.status(400).json({ error: "Current season is not yet complete." });
        return;
      }

      // Season bonus: $5,000 cash + 52 fresh weeks. Stacks gracefully if cash is negative.
      const SEASON_BONUS = 5000;
      // Snapshot the just-ended season's stats so we can return them for the
      // celebration screen — then reset to a fresh tally for the new season.
      const endedSeasonStats = gameRun.seasonStats;
      const updated = await storage.updateGameRun(gameRunId, {
        weeksRemaining: gameRun.weeksRemaining + 52,
        seasonsUnlocked: (gameRun.seasonsUnlocked ?? 1) + 1,
        adsWatchedForSeasons: (gameRun.adsWatchedForSeasons ?? 0) + 1,
        cash: gameRun.cash + SEASON_BONUS,
        seasonStats: {
          bestDealProfit: 0,
          bestDealLabel: '',
          totalCashFlow: 0,
          dealsClosed: 0,
          profitableThisSeason: 0,
          xpEarnedThisSeason: 0,
        },
      });

      // Ledger entry so the bonus shows up in the player's transaction history.
      try {
        await storage.createLedgerEntry({
          gameRunId,
          direction: 'credit',
          category: 'income',
          amount: SEASON_BONUS,
          description: `Season ${(gameRun.seasonsUnlocked ?? 1) + 1} unlock bonus`,
          gameWeek: gameRun.currentWeek,
          balanceAfter: (updated?.cash ?? gameRun.cash + SEASON_BONUS),
        });
      } catch (err) {
        console.error("Failed to write season-unlock ledger entry:", err);
      }

      res.json({
        success: true,
        bonus: SEASON_BONUS,
        seasonsUnlocked: updated?.seasonsUnlocked,
        weeksRemaining: updated?.weeksRemaining,
        endedSeasonStats, // so the celebrate phase can still reference what the player just did
        gameRun: updated,
      });
    } catch (error: any) {
      console.error("Error unlocking season:", error);
      res.status(500).json({ error: error.message || "Failed to unlock season" });
    } finally {
      unlockInFlight.delete(gameRunId);
    }
  });

  // Activate a rental property (rate limited - deal action)
  app.post("/api/deals/:id/activate-rental", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId } = req.body as {
        gameRunId: number;
      };

      const deal = await storage.getDealsByGameRun(gameRunId);
      const targetDeal = deal.find(d => d.id === dealId);
      if (!targetDeal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const result = await gameMechanics.activateRentalProperty(
        targetDeal,
        gameRun
      );
      
      // Award trophies for rental activation
      let awardedTrophies: string[] = [];
      try {
        const player = await storage.getOrCreatePlayer(gameRun.playerName);
        awardedTrophies = await gameMechanics.checkAndAwardTrophies(player.id, gameRunId, {
          dealCompleted: true,
          dealStrategy: 'rental',
        });
      } catch (trophyErr) {
        console.error('Error awarding trophies:', trophyErr);
      }
      
      res.json({ ...result, awardedTrophies });
    } catch (error: any) {
      console.error("Error activating rental:", error);
      res.status(500).json({ error: error.message || "Failed to activate rental" });
    }
  });

  // Start flip rehab period (rate limited - deal action)
  app.post("/api/deals/:id/start-rehab", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId, rehabWeeks } = req.body as {
        gameRunId: number;
        rehabWeeks: number;
      };

      const deals = await storage.getDealsByGameRun(gameRunId);
      const targetDeal = deals.find(d => d.id === dealId);
      if (!targetDeal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const updatedDeal = await gameMechanics.startFlipRehab(targetDeal, rehabWeeks, gameRun);
      res.json(updatedDeal);
    } catch (error: any) {
      console.error("Error starting rehab:", error);
      res.status(500).json({ error: error.message || "Failed to start rehab" });
    }
  });

  // Complete a flip deal (rate limited - deal action)
  app.post("/api/deals/:id/complete-flip", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId, curveball } = req.body as {
        gameRunId: number;
        curveball?: any;
      };

      const deals = await storage.getDealsByGameRun(gameRunId);
      const targetDeal = deals.find(d => d.id === dealId);
      if (!targetDeal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const result = await gameMechanics.completeFlipDeal(targetDeal, gameRun, curveball);
      res.json(result);
    } catch (error: any) {
      console.error("Error completing flip:", error);
      res.status(500).json({ error: error.message || "Failed to complete flip" });
    }
  });

  // Premium purchase - SKU-based (BUG-002: gated, authenticated, server-defined amounts)
  app.post("/api/game-runs/:id/purchase", requirePremiumEnabled, requireAdmin, purchaseLimiter, async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { sku } = req.body as { sku: string; amount?: unknown };

      // BUG-002: Reject any request that supplies a client-side amount
      if ('amount' in req.body || 'cashAmount' in req.body || 'weeksAmount' in req.body) {
        res.status(400).json({ error: "Client-supplied amounts are not allowed. Use a valid SKU." });
        return;
      }

      if (!sku || !PREMIUM_SKU_MAP[sku]) {
        res.status(400).json({ error: "Invalid SKU", validSkus: Object.keys(PREMIUM_SKU_MAP) });
        return;
      }

      const skuData = PREMIUM_SKU_MAP[sku];

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const updates: Record<string, number> = {};
      if (skuData.cash > 0) updates.cash = gameRun.cash + skuData.cash;
      if (skuData.weeks > 0) updates.weeksRemaining = gameRun.weeksRemaining + skuData.weeks;

      const updatedGameRun = await storage.updateGameRun(gameRunId, updates);

      res.json(updatedGameRun);
    } catch (error: any) {
      console.error("Error purchasing bundle:", error);
      res.status(500).json({ error: error.message || "Failed to purchase bundle" });
    }
  });

  // ============ STRIPE CHECKOUT ROUTES ============

  app.get("/api/stripe/publishable-key", requirePremiumEnabled, async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      console.error("Error getting publishable key:", error);
      res.status(500).json({ error: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/create-checkout", requirePremiumEnabled, purchaseLimiter, async (req, res) => {
    try {
      const { sku, gameRunId } = req.body as { sku: string; gameRunId: number };

      if (!sku || !PREMIUM_SKU_MAP[sku]) {
        res.status(400).json({ error: "Invalid SKU", validSkus: Object.keys(PREMIUM_SKU_MAP) });
        return;
      }

      if (!gameRunId) {
        res.status(400).json({ error: "gameRunId is required" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const stripe = await getUncachableStripeClient();

      const products = await stripe.products.search({ query: `metadata['sku']:'${sku}'` });
      if (!products.data.length) {
        res.status(404).json({ error: "Product not found in Stripe" });
        return;
      }

      const product = products.data[0];
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 1 });
      if (!prices.data.length) {
        res.status(404).json({ error: "No active price found for product" });
        return;
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price: prices.data[0].id,
          quantity: 1,
        }],
        metadata: {
          sku,
          gameRunId: String(gameRunId),
        },
        success_url: `${baseUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/?checkout=cancelled`,
      });

      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/verify-session", requirePremiumEnabled, async (req, res) => {
    try {
      const { sessionId } = req.body as { sessionId: string };
      if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        res.status(400).json({ error: "Payment not completed", status: session.payment_status });
        return;
      }

      if (consumedCheckoutSessions.has(sessionId)) {
        const gameRunId = parseInt(session.metadata?.gameRunId || '0');
        const gameRun = gameRunId ? await storage.getGameRun(gameRunId) : null;
        res.json({ success: true, gameRun, applied: null, alreadyApplied: true });
        return;
      }

      const sku = session.metadata?.sku;
      const gameRunId = parseInt(session.metadata?.gameRunId || '0');

      if (!sku || !PREMIUM_SKU_MAP[sku] || !gameRunId) {
        res.status(400).json({ error: "Invalid session metadata" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      consumedCheckoutSessions.add(sessionId);

      const skuData = PREMIUM_SKU_MAP[sku];
      const updates: Record<string, number> = {};
      if (skuData.cash > 0) updates.cash = gameRun.cash + skuData.cash;
      if (skuData.weeks > 0) updates.weeksRemaining = gameRun.weeksRemaining + skuData.weeks;

      const updatedGameRun = await storage.updateGameRun(gameRunId, updates);
      res.json({ success: true, gameRun: updatedGameRun, applied: skuData });
    } catch (error: any) {
      console.error("Error verifying session:", error);
      res.status(500).json({ error: "Failed to verify checkout session" });
    }
  });

  // ============ HALL OF FAME ROUTES ============

  // Get or create player by name
  app.post("/api/players", async (req, res) => {
    try {
      const { playerName } = req.body as { playerName: string };
      if (!playerName || playerName.trim().length === 0) {
        res.status(400).json({ error: "Player name is required" });
        return;
      }
      const player = await storage.getOrCreatePlayer(playerName.trim());
      res.json(player);
    } catch (error) {
      console.error("Error creating/fetching player:", error);
      res.status(500).json({ error: "Failed to create player" });
    }
  });

  // Get all Hall of Fame players (leaderboard)
  app.get("/api/hall-of-fame", async (req, res) => {
    try {
      const players = await storage.getAllPlayers();
      const allTrophies = await storage.getAllTrophies();
      
      const playersWithTrophies = players.map(player => ({
        ...player,
        trophies: allTrophies.filter(t => t.playerId === player.id)
      }));
      
      res.json(playersWithTrophies);
    } catch (error) {
      console.error("Error fetching Hall of Fame:", error);
      res.status(500).json({ error: "Failed to fetch Hall of Fame" });
    }
  });

  app.post("/api/admin/cleanup-hall-of-fame", async (req, res) => {
    try {
      const { secret } = req.body as { secret?: string };
      if (secret !== 'dealbreak-hof-cleanup-2026') {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }

      const allPlayers = await storage.getAllPlayers();
      const realNames = new Set([
        'Sean', 'James', 'Terry', 'Jerry', 'James Rosenman', 'Mac',
        'Randy', 'AlphaWolfInc', 'Ani', 'Bob', 'Chooro', 'Ciel',
        'Ethan', 'Joel Williams', 'John', 'Larry McPotatoface',
        'Shape', 'Ted', 'Wolvie', 'Hand'
      ]);

      let deleted = 0;
      for (const player of allPlayers) {
        if (!realNames.has(player.playerName)) {
          await storage.deletePlayer(player.id);
          deleted++;
        }
      }

      const seedPlayers = [
        { name: 'Marcus', games: 8, deals: 14, profit: 142500, bestGame: 48200, wins: 3, trophies: ['first_deal', 'profitable_deal', 'winner', 'landlord', 'due_diligence', 'perfectionist'] },
        { name: 'Rachel', games: 5, deals: 10, profit: 118700, bestGame: 52100, wins: 2, trophies: ['first_deal', 'profitable_deal', 'winner', 'flip_master', 'speed_demon'] },
        { name: 'Carlos', games: 12, deals: 22, profit: 205300, bestGame: 41800, wins: 4, trophies: ['first_deal', 'profitable_deal', 'winner', 'perfectionist', 'big_spender', 'landlord', 'urban_expert'] },
        { name: 'Priya', games: 3, deals: 7, profit: 67400, bestGame: 35600, wins: 1, trophies: ['first_deal', 'profitable_deal', 'winner', 'due_diligence'] },
        { name: 'Kevin', games: 15, deals: 28, profit: 310200, bestGame: 55800, wins: 6, trophies: ['first_deal', 'profitable_deal', 'winner', 'perfectionist', 'flip_master', 'landlord', 'big_spender', 'millionaire', 'speed_demon'] },
        { name: 'Tom', games: 6, deals: 9, profit: 78200, bestGame: 32500, wins: 2, trophies: ['first_deal', 'profitable_deal', 'winner', 'survivor'] },
        { name: 'Dan', games: 4, deals: 8, profit: 94600, bestGame: 44100, wins: 2, trophies: ['first_deal', 'profitable_deal', 'winner', 'due_diligence', 'perfectionist'] },
        { name: 'Nina', games: 7, deals: 12, profit: 126800, bestGame: 39400, wins: 3, trophies: ['first_deal', 'profitable_deal', 'winner', 'flip_master', 'landlord'] },
        { name: 'Brandon', games: 10, deals: 19, profit: 178500, bestGame: 47200, wins: 4, trophies: ['first_deal', 'profitable_deal', 'winner', 'flip_master', 'big_spender', 'speed_demon', 'urban_expert'] },
        { name: 'Samantha', games: 2, deals: 5, profit: 38900, bestGame: 24300, wins: 1, trophies: ['first_deal', 'profitable_deal', 'winner'] },
        { name: 'Derek', games: 9, deals: 16, profit: 155200, bestGame: 43600, wins: 3, trophies: ['first_deal', 'profitable_deal', 'winner', 'landlord', 'survivor', 'due_diligence'] },
        { name: 'Liam', games: 3, deals: 4, profit: 22100, bestGame: 15800, wins: 1, trophies: ['first_deal', 'profitable_deal', 'winner'] },
        { name: 'Jasmine', games: 6, deals: 11, profit: 98700, bestGame: 36200, wins: 2, trophies: ['first_deal', 'profitable_deal', 'winner', 'perfectionist', 'due_diligence'] },
        { name: 'Alex', games: 11, deals: 20, profit: 189400, bestGame: 51300, wins: 5, trophies: ['first_deal', 'profitable_deal', 'winner', 'flip_master', 'big_spender', 'landlord', 'speed_demon', 'perfectionist'] },
        { name: 'Mike', games: 4, deals: 6, profit: 45200, bestGame: 28900, wins: 1, trophies: ['first_deal', 'profitable_deal', 'winner', 'survivor'] },
      ];

      let seeded = 0;
      for (const sp of seedPlayers) {
        const player = await storage.getOrCreatePlayer(sp.name);
        await storage.updatePlayerStats(player.id, {
          playerName: sp.name,
          totalGamesPlayed: sp.games,
          totalDealsCompleted: sp.deals,
          totalProfitEarned: sp.profit,
          bestGameProfit: sp.bestGame,
          gamesWon: sp.wins,
        });
        for (const tid of sp.trophies) {
          const has = await storage.hasPlayerTrophy(player.id, tid);
          if (!has) {
            await storage.awardTrophy(player.id, tid);
          }
        }
        seeded++;
      }

      const existing = allPlayers.filter(p => realNames.has(p.playerName));
      for (const ep of existing) {
        if (ep.totalProfitEarned > 0 && ep.gamesWon === 0) {
          await storage.updatePlayerStats(ep.id, { gamesWon: 1 });
        }
      }

      res.json({ deleted, seeded, keptReal: existing.map(p => p.playerName) });
    } catch (error: any) {
      console.error("Error cleaning up Hall of Fame:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get trophy definitions
  app.get("/api/trophies/definitions", async (req, res) => {
    res.json(trophyTypes);
  });

  // Get player's trophies
  app.get("/api/players/:id/trophies", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const trophies = await storage.getPlayerTrophies(playerId);
      res.json(trophies);
    } catch (error) {
      console.error("Error fetching player trophies:", error);
      res.status(500).json({ error: "Failed to fetch trophies" });
    }
  });

  // Award trophy to player
  app.post("/api/players/:id/trophies", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const { trophyId, gameRunId } = req.body as { trophyId: string; gameRunId?: number };
      
      const hasTrophy = await storage.hasPlayerTrophy(playerId, trophyId);
      if (hasTrophy) {
        res.status(200).json({ message: "Trophy already awarded", alreadyHad: true });
        return;
      }
      
      const trophy = await storage.awardTrophy(playerId, trophyId, gameRunId);
      res.json({ trophy, alreadyHad: false });
    } catch (error) {
      console.error("Error awarding trophy:", error);
      res.status(500).json({ error: "Failed to award trophy" });
    }
  });

  // Update player stats (after game completion)
  app.patch("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const updates = req.body as {
        totalGamesPlayed?: number;
        totalDealsCompleted?: number;
        totalProfitEarned?: number;
        bestGameProfit?: number;
        gamesWon?: number;
      };
      
      const player = await storage.updatePlayerStats(playerId, updates);
      if (!player) {
        res.status(404).json({ error: "Player not found" });
        return;
      }
      res.json(player);
    } catch (error) {
      console.error("Error updating player stats:", error);
      res.status(500).json({ error: "Failed to update player stats" });
    }
  });

  // End game and award trophies
  app.post("/api/game-runs/:id/end", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { won, finalCash, weeksRemaining } = req.body as {
        won: boolean;
        finalCash: number;
        weeksRemaining: number;
      };
      
      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      // Update game run status
      await storage.updateGameRun(gameRunId, {
        status: won ? 'won' : 'lost',
      });

      // Get player and award trophies (wrapped to prevent blocking game end)
      const player = await storage.getOrCreatePlayer(gameRun.playerName);
      let awardedTrophies: string[] = [];
      let trophyAwardError = false;
      try {
        awardedTrophies = await gameMechanics.checkAndAwardTrophies(player.id, gameRunId, {
          gameEnded: true,
          gameWon: won,
          finalCash,
          weeksRemaining,
        });
      } catch (trophyErr) {
        console.error('Error awarding trophies (continuing):', trophyErr);
        trophyAwardError = true;
      }

      // Update player stats (note: totalGamesPlayed is already incremented when game starts)
      const deals = await storage.getDealsByGameRun(gameRunId);
      const completedDeals = deals.filter(d => d.status === 'completed' || d.status === 'active_rental' || d.status === 'sold_rental');
      
      // Calculate total profit including rental income
      // For flips/sold rentals: use actualProfit
      // For active rentals: calculate cumulative income from weekly income × weeks held
      const totalProfit = completedDeals.reduce((sum, d) => {
        if (d.actualProfit != null) {
          return sum + d.actualProfit;
        }
        // For active rentals, estimate profit from weekly income
        if (d.status === 'active_rental' && d.weeklyIncome) {
          const purchaseWeek = (d as any).purchaseWeek || 0;
          const weeksHeld = Math.max(1, gameRun.currentWeek - purchaseWeek);
          return sum + (d.weeklyIncome * weeksHeld);
        }
        return sum;
      }, 0);

      await storage.updatePlayerStats(player.id, {
        totalDealsCompleted: player.totalDealsCompleted + completedDeals.length,
        totalProfitEarned: player.totalProfitEarned + Math.max(0, totalProfit),
        bestGameProfit: Math.max(player.bestGameProfit, totalProfit),
        gamesWon: player.gamesWon + (won ? 1 : 0),
      });

      res.json({ 
        success: true, 
        awardedTrophies,
        trophyErrors: trophyAwardError ? 'Some trophies may not have been awarded' : undefined,
        playerStats: {
          totalGamesPlayed: player.totalGamesPlayed,
          gamesWon: player.gamesWon + (won ? 1 : 0),
        }
      });
    } catch (error) {
      console.error("Error ending game:", error);
      res.status(500).json({ error: "Failed to end game" });
    }
  });

  // Sell an active rental property
  app.post("/api/deals/:id/sell", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId } = req.body as { gameRunId: number };

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      if (deal.status !== 'active_rental') {
        res.status(400).json({ error: "Can only sell active rental properties" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const result = await storage.sellRentalProperty(dealId, gameRunId);
      res.json(result);
    } catch (error: any) {
      console.error("Error selling rental:", error);
      res.status(500).json({ error: error.message || "Failed to sell property" });
    }
  });

  // Sell a flip property (ready_to_list status)
  app.post("/api/deals/:id/sell-flip", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId } = req.body as { gameRunId: number };

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      if (deal.status !== 'ready_to_list') {
        res.status(400).json({ error: "Can only sell properties that are ready to list" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const result = await storage.sellFlipProperty(dealId, gameRunId);
      
      // Award trophies for flip completion
      let awardedTrophies: string[] = [];
      try {
        const player = await storage.getOrCreatePlayer(gameRun.playerName);
        awardedTrophies = await gameMechanics.checkAndAwardTrophies(player.id, gameRunId, {
          dealCompleted: true,
          dealProfit: result.saleProfit,
          dealStrategy: 'flip',
        });
      } catch (trophyErr) {
        console.error('Error awarding trophies:', trophyErr);
      }
      
      res.json({ ...result, awardedTrophies });
    } catch (error: any) {
      console.error("Error selling flip:", error);
      res.status(500).json({ error: error.message || "Failed to sell flip property" });
    }
  });

  // Get refinance options for a rental property
  app.get("/api/deals/:id/refinance-options", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const gameRunId = parseInt(req.query.gameRunId as string);

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      if (deal.status !== 'active_rental') {
        res.status(400).json({ error: "Can only refinance active rental properties" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      // Get all deals for debt-to-income calculations
      const allDeals = await storage.getDealsByGameRun(gameRunId);
      const property = await storage.getProperty(deal.propertyId);
      if (!property) {
        res.status(404).json({ error: "Property not found" });
        return;
      }

      const options = await calculateRefinanceOptions(deal, gameRun, allDeals, property);
      res.json(options);
    } catch (error: any) {
      console.error("Error getting refinance options:", error);
      res.status(400).json({ error: error.message || "Failed to get refinance options" });
    }
  });

  // Refinance rental property (cash-out refinance)
  app.post("/api/deals/:id/refinance", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId, requestedCashOut, selectedLtv } = req.body as { 
        gameRunId: number; 
        requestedCashOut?: number;
        selectedLtv?: number;
      };

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        res.status(404).json({ error: "Deal not found" });
        return;
      }
      if (deal.status !== 'active_rental') {
        res.status(400).json({ error: "Can only refinance active rental properties" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      // Get all deals for rate calculations
      const allDeals = await storage.getDealsByGameRun(gameRunId);
      const property = await storage.getProperty(deal.propertyId);
      if (!property) {
        res.status(404).json({ error: "Property not found" });
        return;
      }

      const result = await storage.refinanceRentalProperty(dealId, gameRunId, requestedCashOut, selectedLtv, allDeals, property);
      res.json(result);
    } catch (error: any) {
      console.error("Error refinancing property:", error);
      res.status(400).json({ error: error.message || "Failed to refinance property" });
    }
  });

  app.post("/api/deals/:id/cosmetic-upgrade", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId } = req.body as { gameRunId: number };

      const result = await gameMechanics.applyCosmeticUpgrade(dealId, gameRunId);
      res.json(result);
    } catch (error: any) {
      console.error("Error applying cosmetic upgrade:", error);
      res.status(400).json({ error: error.message || "Failed to apply cosmetic upgrade" });
    }
  });

  // === TENANT ROUTES ===

  // Get tenants for a game run
  app.get("/api/game-runs/:id/tenants", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const tenants = await storage.getTenantsByGameRun(gameRunId);
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  // Create a tenant for a deal (called when rental becomes active)
  app.post("/api/deals/:dealId/tenant", gameActionLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const { name, personalityType, speechPatterns } = req.body;

      // Check if tenant already exists for this deal
      const existingTenant = await storage.getTenantByDeal(dealId);
      if (existingTenant) {
        res.json(existingTenant);
        return;
      }

      const deal = await storage.getDeal(dealId);
      const property = deal?.propertyId ? await storage.getProperty(deal.propertyId) : null;
      const unfixedCount = property ? getUnfixedIssues(deal!, property).length : 0;
      const conditionPenalty = Math.min(unfixedCount * 3, 15);
      const initialSatisfaction = (70 + Math.floor(Math.random() * 16)) - conditionPenalty;

      const gameRun = deal ? await storage.getGameRun(deal.gameRunId) : null;
      const currentWeek = gameRun?.currentWeek || 0;
      const currentRent = deal?.proFormaOutputs ? (deal.proFormaOutputs as any).monthlyGrossRent || 0 : 0;

      const tenant = await storage.createTenant({
        dealId,
        name,
        personalityType,
        speechPatterns,
        lastContactWeek: null,
        satisfaction: Math.max(40, initialSatisfaction),
        weeksUnhappy: 0,
        leaseStartWeek: currentWeek,
        leaseRentAmount: currentRent || null,
      });
      res.json(tenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  // Generate tenant portrait using GPT image
  app.post("/api/tenants/:id/generate-portrait", gameActionLimiter, async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const { prompt } = req.body;

      // Initialize OpenAI client with AI integrations
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "256x256",
      });

      // Get base64 image data
      const imageData = response.data?.[0]?.b64_json;
      if (!imageData) {
        throw new Error("No image data returned");
      }

      // Convert to data URL
      const portraitUrl = `data:image/png;base64,${imageData}`;

      // Update tenant with portrait
      const updated = await storage.updateTenant(tenantId, { portraitUrl });
      res.json(updated);
    } catch (error: any) {
      console.error("Error generating portrait:", error);
      // Don't fail the whole flow - just return without portrait
      res.status(200).json({ error: "Portrait generation failed, continuing without portrait" });
    }
  });

  // Update tenant (e.g., update lastContactWeek)
  app.patch("/api/tenants/:id", async (req, res) => {
    try {
      const tenantId = parseInt(req.params.id);
      const updates = req.body;
      const updated = await storage.updateTenant(tenantId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  // ============ CONTRACTOR WALKTHROUGH ROUTES ============

  // Perform contractor walkthrough on an owned rental
  app.post("/api/deals/:dealId/contractor-walkthrough", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const { gameRunId } = req.body;

      if (!gameRunId) {
        return res.status(400).json({ error: "gameRunId is required" });
      }

      const result = await gameMechanics.performContractorWalkthrough(dealId, gameRunId);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error("Error performing contractor walkthrough:", error);
      res.status(500).json({ error: "Failed to perform contractor walkthrough" });
    }
  });

  // Get walkthrough quote (fee preview without committing)
  app.get("/api/deals/:dealId/contractor-walkthrough-quote", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const gameRunId = parseInt(req.query.gameRunId as string);

      if (!gameRunId) {
        return res.status(400).json({ error: "gameRunId query param is required" });
      }

      const deal = await storage.getDeal(dealId);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }

      if (deal.status !== 'active_rental' && deal.status !== 'ready_to_list') {
        return res.status(400).json({ error: "Property must be active to inspect", eligible: false });
      }

      if (deal.contractorWalkthroughCompleted) {
        const walkthroughData = deal.contractorWalkthroughData as any;
        const completedRepairIds = (deal.completedRepairIds as string[] | null) || [];
        const allRepairItems = walkthroughData?.repairItems || [];
        const remainingItems = allRepairItems.filter(
          (item: any) => !completedRepairIds.includes(item.id)
        );

        const rawProperty = await storage.getProperty(deal.propertyId);
        const gameRun = await storage.getGameRun(gameRunId);
        const property = (rawProperty && gameRun) ? gameMechanics.applyPriceDrift(rawProperty, gameRun.priceDriftPct ?? 0) : rawProperty;
        const completedUpgradeIds = ((deal.proFormaOutputs as any)?.completedUpgradeIds as string[]) || [];
        const upgradeItems = (property && gameRun) ? gameMechanics.generateUpgradeItems(
          property,
          (gameRun.marketCondition as any) || 'neutral',
          completedUpgradeIds,
          dealId * 7 + gameRun.currentWeek
        ) : [];

        const hasContent = remainingItems.length > 0 || upgradeItems.length > 0;
        return res.json({ 
          eligible: hasContent,
          completed: true,
          hasRemainingRepairs: remainingItems.length > 0,
          hasUpgrades: upgradeItems.length > 0,
          completedRepairIds,
          data: {
            ...walkthroughData,
            repairItems: remainingItems,
            totalRepairCost: remainingItems.reduce((sum: number, item: any) => sum + item.contractorCost, 0),
            upgradeItems,
          }
        });
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        return res.status(404).json({ error: "Game run not found" });
      }

      // Generate deterministic quote based on deal ID and current week
      const seed = dealId * 1000 + gameRun.currentWeek;
      let state = seed;
      const random = () => {
        state = (state * 1103515245 + 12345) & 0x7fffffff;
        return state / 0x7fffffff;
      };
      const walkthroughFee = Math.round(400 + random() * 400);

      res.json({
        eligible: true,
        completed: false,
        walkthroughFee,
        canAfford: gameRun.cash >= walkthroughFee,
        currentCash: gameRun.cash,
      });
    } catch (error) {
      console.error("Error getting walkthrough quote:", error);
      res.status(500).json({ error: "Failed to get walkthrough quote" });
    }
  });

  // Initiate rental rehab (repairs on owned rental property)
  app.post("/api/deals/:dealId/rental-rehab", dealLimiter, async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      const { gameRunId, selectedRepairIds } = req.body;

      if (!gameRunId) {
        return res.status(400).json({ error: "gameRunId is required" });
      }

      // Validate selectedRepairIds if provided
      const validatedRepairIds = Array.isArray(selectedRepairIds) ? selectedRepairIds : undefined;

      const result = await gameMechanics.initiateRentalRehab(dealId, gameRunId, validatedRepairIds);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json(result);
    } catch (error) {
      console.error("Error initiating rental rehab:", error);
      res.status(500).json({ error: "Failed to initiate rental rehab" });
    }
  });

  // ============ COUPON ROUTES ============

  // Validation schema for coupon redemption
  const redeemCouponSchema = z.object({
    code: z.string().min(1).max(50),
    gameRunId: z.number().int().positive(),
  });

  // Redeem a coupon code
  app.post("/api/coupons/redeem", purchaseLimiter, async (req, res) => {
    try {
      const validatedData = redeemCouponSchema.parse(req.body);
      const { code, gameRunId } = validatedData;

      // Look up the coupon
      const coupon = await storage.getCouponByCode(code.trim());
      
      if (!coupon) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }

      // Check if active
      if (!coupon.isActive) {
        return res.status(400).json({ error: "This coupon is no longer active" });
      }

      // Check expiration
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        return res.status(400).json({ error: "This coupon has expired" });
      }

      // Check usage limit
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ error: "This coupon has reached its usage limit" });
      }

      // Check if already redeemed in this game
      const alreadyRedeemed = await storage.hasRedeemedCoupon(coupon.id, gameRunId);
      if (alreadyRedeemed) {
        return res.status(400).json({ error: "You've already redeemed this coupon in this game" });
      }

      // Redeem the coupon
      const result = await storage.redeemCoupon(coupon.id, gameRunId);
      
      res.json({
        success: true,
        cashAdded: result.cashAdded,
        monthsAdded: result.monthsAdded,
        newCash: result.gameRun.cash,
        newWeeks: result.gameRun.weeksRemaining,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error redeeming coupon:", error);
      // Return the actual error message for user-facing errors
      res.status(400).json({ error: error.message || "Failed to redeem coupon" });
    }
  });

  // Validation schemas for coupon operations
  const createCouponSchema = z.object({
    code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric with underscores/hyphens"),
    cashAmount: z.number().int().min(0).default(0),
    monthsAmount: z.number().int().min(0).default(0),
    usageLimit: z.number().int().min(1).nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  });

  const updateCouponSchema = z.object({
    isActive: z.boolean().optional(),
    usageLimit: z.number().int().min(1).nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  });

  // Admin authentication middleware
  const checkAdminKey = (req: any, res: any): boolean => {
    // Check header first (preferred), then body
    const adminKey = req.headers['x-admin-key'] || req.body?.adminKey;
    const envAdminKey = process.env.ADMIN_KEY;
    
    // Only allow if ADMIN_KEY env var is set and matches
    if (!envAdminKey || adminKey !== envAdminKey) {
      res.status(401).json({ error: "Unauthorized" });
      return false;
    }
    return true;
  };

  // Admin: Create a new coupon
  app.post("/api/admin/coupons", async (req, res) => {
    try {
      if (!checkAdminKey(req, res)) return;

      const validatedData = createCouponSchema.parse(req.body);

      // Check if code already exists
      const existing = await storage.getCouponByCode(validatedData.code);
      if (existing) {
        return res.status(400).json({ error: "Coupon code already exists" });
      }

      const coupon = await storage.createCoupon({
        code: validatedData.code.toUpperCase().trim(),
        cashAmount: validatedData.cashAmount,
        monthsAmount: validatedData.monthsAmount,
        usageLimit: validatedData.usageLimit ?? null,
        isActive: true,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      });

      res.json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating coupon:", error);
      res.status(500).json({ error: "Failed to create coupon" });
    }
  });

  // Admin: List all coupons
  app.get("/api/admin/coupons", async (req, res) => {
    try {
      // Check admin key from header
      const adminKey = req.headers['x-admin-key'];
      const envAdminKey = process.env.ADMIN_KEY;
      
      if (!envAdminKey || adminKey !== envAdminKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const coupons = await storage.getAllCoupons();
      res.json(coupons);
    } catch (error) {
      console.error("Error listing coupons:", error);
      res.status(500).json({ error: "Failed to list coupons" });
    }
  });

  // Admin: Update coupon (toggle active, change limits, etc.)
  app.patch("/api/admin/coupons/:id", async (req, res) => {
    try {
      if (!checkAdminKey(req, res)) return;

      const couponId = parseInt(req.params.id);
      const { adminKey, ...body } = req.body;
      
      const validatedData = updateCouponSchema.parse(body);
      const updatePayload: any = { ...validatedData };
      if (validatedData.expiresAt) {
        updatePayload.expiresAt = new Date(validatedData.expiresAt);
      }
      const coupon = await storage.updateCoupon(couponId, updatePayload);
      res.json(coupon);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating coupon:", error);
      res.status(500).json({ error: "Failed to update coupon" });
    }
  });

  // Achievement routes
  app.get("/api/game-runs/:id/achievements", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const achievements = await storage.getAchievements(gameRunId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  const unlockAchievementSchema = z.object({
    achievementId: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
  });

  app.post("/api/game-runs/:id/achievements", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      if (isNaN(gameRunId)) {
        return res.status(400).json({ error: "Invalid game run ID" });
      }
      
      const parseResult = unlockAchievementSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request body", details: parseResult.error.errors });
      }
      
      const { achievementId, metadata } = parseResult.data;
      
      // Check if already unlocked
      const hasIt = await storage.hasAchievement(gameRunId, achievementId);
      if (hasIt) {
        return res.status(200).json({ alreadyUnlocked: true });
      }
      
      const achievement = await storage.unlockAchievement(gameRunId, achievementId, metadata);
      res.json(achievement);
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      res.status(500).json({ error: "Failed to unlock achievement" });
    }
  });

  return httpServer;
}
