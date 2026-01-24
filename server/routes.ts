import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameRunSchema, insertDealSchema, insertPropertyInvestigationSchema, insertLedgerEntrySchema, insertTenantSchema, trophyTypes, type Deal, type GameRun, type Property } from "@shared/schema";
import { z } from "zod";
import * as gameMechanics from "./gameMechanics";
import { dealLimiter, ledgerLimiter, gameActionLimiter, authLimiter, purchaseLimiter } from "./rateLimiter";
import OpenAI from "openai";

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
      reason: `Must hold property for ${SEASONING_WEEKS} weeks before refinancing`,
    };
  }
  
  // Check refinance cooldown (must wait 4 weeks between refinances)
  if (deal.lastRefinanceWeek !== null && deal.lastRefinanceWeek !== undefined) {
    const weeksSinceLastRefi = currentWeek - deal.lastRefinanceWeek;
    if (weeksSinceLastRefi < REFINANCE_COOLDOWN_WEEKS) {
      return {
        eligible: false,
        weeksUntilEligible: REFINANCE_COOLDOWN_WEEKS - weeksSinceLastRefi,
        reason: `Must wait ${REFINANCE_COOLDOWN_WEEKS - weeksSinceLastRefi} more week(s) before refinancing again`,
      };
    }
  }
  
  // Calculate current property value with appreciation
  // Deterministic appreciation based on weeks held - no random variation
  // This ensures consistent values when modal is reopened
  const monthsHeld = Math.floor(weeksHeld / 4.33);
  const baseAppreciation = 0.02; // 2% base (market floor)
  const timeAppreciation = Math.min(monthsHeld * 0.005, 0.10); // 0.5% per month, max 10%
  // Use property location for a small deterministic variation (urban appreciates faster)
  const locationBonus = property.locationType === 'urban' ? 0.015 : 0;
  const totalAppreciation = 1 + baseAppreciation + timeAppreciation + locationBonus;
  const currentMarketValue = Math.round(property.price * totalAppreciation);
  
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
  
  // Initialize database with starter properties
  await storage.seedProperties();
  
  // Update location types for existing properties (fixes production data)
  await storage.updatePropertyLocationTypes();

  // Get all properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  // Create new game run
  app.post("/api/game-runs", async (req, res) => {
    try {
      const validated = insertGameRunSchema.parse(req.body);
      const gameRun = await storage.createGameRun(validated);
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
      const result = await gameMechanics.advanceGameWeek(gameRunId);
      res.json(result);
    } catch (error: any) {
      console.error("Error advancing game week:", error);
      res.status(500).json({ error: error.message || "Failed to advance game week" });
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

      const updatedDeal = await gameMechanics.startFlipRehab(targetDeal, rehabWeeks);
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

  // Premium purchase - Add cash (rate limited - sensitive operation)
  app.post("/api/game-runs/:id/purchase-cash", purchaseLimiter, async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { amount } = req.body as { amount: number };

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const updatedGameRun = await storage.updateGameRun(gameRunId, {
        cash: gameRun.cash + amount
      });

      res.json(updatedGameRun);
    } catch (error: any) {
      console.error("Error purchasing cash:", error);
      res.status(500).json({ error: error.message || "Failed to purchase cash" });
    }
  });

  // Premium purchase - Add weeks (rate limited - sensitive operation)
  app.post("/api/game-runs/:id/purchase-weeks", purchaseLimiter, async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { amount } = req.body as { amount: number };

      if (!amount || amount <= 0) {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const updatedGameRun = await storage.updateGameRun(gameRunId, {
        weeksRemaining: gameRun.weeksRemaining + amount
      });

      res.json(updatedGameRun);
    } catch (error: any) {
      console.error("Error purchasing weeks:", error);
      res.status(500).json({ error: error.message || "Failed to purchase weeks" });
    }
  });

  // Premium purchase - Add bundle (rate limited - sensitive operation)
  app.post("/api/game-runs/:id/purchase-bundle", purchaseLimiter, async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { cashAmount, weeksAmount } = req.body as {
        cashAmount: number;
        weeksAmount: number;
      };

      if ((!cashAmount || cashAmount <= 0) && (!weeksAmount || weeksAmount <= 0)) {
        res.status(400).json({ error: "Invalid amounts" });
        return;
      }

      const gameRun = await storage.getGameRun(gameRunId);
      if (!gameRun) {
        res.status(404).json({ error: "Game run not found" });
        return;
      }

      const updatedGameRun = await storage.updateGameRun(gameRunId, {
        cash: gameRun.cash + (cashAmount || 0),
        weeksRemaining: gameRun.weeksRemaining + (weeksAmount || 0)
      });

      res.json(updatedGameRun);
    } catch (error: any) {
      console.error("Error purchasing bundle:", error);
      res.status(500).json({ error: error.message || "Failed to purchase bundle" });
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

      // Selling costs 2 weeks
      const WEEKS_TO_SELL = 2;
      if (gameRun.weeksRemaining < WEEKS_TO_SELL) {
        res.status(400).json({ error: "Not enough time to sell (requires 2 weeks)" });
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

      // Selling costs 2 weeks
      const WEEKS_TO_SELL = 2;
      if (gameRun.weeksRemaining < WEEKS_TO_SELL) {
        res.status(400).json({ error: "Not enough time to sell (requires 2 weeks)" });
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

      const tenant = await storage.createTenant({
        dealId,
        name,
        personalityType,
        speechPatterns,
        lastContactWeek: null,
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

  return httpServer;
}
