import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameRunSchema, insertDealSchema, insertPropertyInvestigationSchema, insertLedgerEntrySchema } from "@shared/schema";
import { z } from "zod";
import * as gameMechanics from "./gameMechanics";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize database with starter properties
  await storage.seedProperties();

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

  // Create deal
  app.post("/api/deals", async (req, res) => {
    try {
      const validated = insertDealSchema.parse(req.body);
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

  // Create ledger entries with cash update
  app.post("/api/game-runs/:id/ledger", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const { entries, currentCash } = req.body as {
        entries: Array<{ direction: string; category: string; amount: number; description: string; propertyId?: number; dealId?: number }>;
        currentCash: number;
      };

      const result = await storage.createLedgerEntriesWithCashUpdate(gameRunId, entries, currentCash);
      res.json(result);
    } catch (error) {
      console.error("Error creating ledger entries:", error);
      res.status(500).json({ error: "Failed to create ledger entries" });
    }
  });

  // Advance game by one week (process income, complete deals, trigger events)
  app.post("/api/game-runs/:id/advance-week", async (req, res) => {
    try {
      const gameRunId = parseInt(req.params.id);
      const result = await gameMechanics.advanceGameWeek(gameRunId);
      res.json(result);
    } catch (error: any) {
      console.error("Error advancing game week:", error);
      res.status(500).json({ error: error.message || "Failed to advance game week" });
    }
  });

  // Activate a rental property (after leasing)
  app.post("/api/deals/:id/activate-rental", async (req, res) => {
    try {
      const dealId = parseInt(req.params.id);
      const { gameRunId, monthlyCashFlow } = req.body as {
        gameRunId: number;
        monthlyCashFlow: number;
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

      const updatedDeal = await gameMechanics.activateRentalProperty(
        targetDeal,
        gameRun,
        monthlyCashFlow
      );
      res.json(updatedDeal);
    } catch (error: any) {
      console.error("Error activating rental:", error);
      res.status(500).json({ error: error.message || "Failed to activate rental" });
    }
  });

  // Start flip rehab period
  app.post("/api/deals/:id/start-rehab", async (req, res) => {
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

  // Complete a flip deal manually (for testing or immediate completion)
  app.post("/api/deals/:id/complete-flip", async (req, res) => {
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

  return httpServer;
}
