/**
 * Game Mechanics Module
 *
 * Handles core game systems:
 * - Flip deal completion and proceeds distribution
 * - Rental income payouts (weekly)
 * - Time progression
 * - Curveball event triggering
 */

import { storage } from './storage';
import type { GameRun, Deal, InsertLedgerEntry, InsertCurveballEvent } from '@shared/schema';
import * as schema from '@shared/schema';
import { db } from './storage';
import { eq } from 'drizzle-orm';
import { rollForCurveball } from '../client/src/lib/curveballs';

/**
 * Check and award trophies based on game state
 * Returns array of newly awarded trophy IDs
 */
export async function checkAndAwardTrophies(
  playerId: number,
  gameRunId: number,
  context: {
    dealCompleted?: boolean;
    dealProfit?: number;
    dealStrategy?: 'flip' | 'rental';
    gameEnded?: boolean;
    gameWon?: boolean;
    finalCash?: number;
    weeksRemaining?: number;
  }
): Promise<string[]> {
  const awardedTrophies: string[] = [];
  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) return awardedTrophies;

  const deals = await storage.getDealsByGameRun(gameRunId);
  const completedDeals = deals.filter(d => d.status === 'completed' || d.status === 'active_rental');
  const profitableDeals = completedDeals.filter(d => (d.actualProfit || 0) > 0 || d.status === 'active_rental');
  const flipDeals = completedDeals.filter(d => d.strategy === 'flip');
  const rentalDeals = deals.filter(d => d.status === 'active_rental');

  // Get all deals across all games for cross-game trophies
  const allPlayerDeals = await storage.getDealsByPlayerName(gameRun.playerName);
  const allCompletedFlips = allPlayerDeals.filter(d => d.status === 'completed' && d.strategy === 'flip');

  // Helper to award trophy if not already earned
  const tryAward = async (trophyId: string): Promise<boolean> => {
    const hasTrophy = await storage.hasPlayerTrophy(playerId, trophyId);
    if (!hasTrophy) {
      await storage.awardTrophy(playerId, trophyId, gameRunId);
      awardedTrophies.push(trophyId);
      return true;
    }
    return false;
  };

  // First Deal - Complete any deal
  if (completedDeals.length >= 1) {
    await tryAward('first_deal');
  }

  // Profitable Deal - Complete a profitable deal
  if (profitableDeals.length >= 1) {
    await tryAward('profitable_deal');
  }

  // Flip Master - Complete 5 successful flips (across all games)
  if (allCompletedFlips.length >= 5) {
    await tryAward('flip_master');
  }

  // Landlord - Own 3 rental properties in one game
  if (rentalDeals.length >= 3) {
    await tryAward('landlord');
  }

  // Game-end trophies
  if (context.gameEnded) {
    // Winner - Win the game
    if (context.gameWon) {
      await tryAward('winner');
    }

    // Speed Demon - Win with 20+ weeks remaining
    if (context.gameWon && (context.weeksRemaining || 0) >= 20) {
      await tryAward('speed_demon');
    }

    // Millionaire - End game with $1M+ cash
    if ((context.finalCash || 0) >= 1000000) {
      await tryAward('millionaire');
    }

    // Perfectionist - Win with all profitable deals (no losses)
    if (context.gameWon && completedDeals.length > 0) {
      const allProfitable = completedDeals.every(d => (d.actualProfit || 0) >= 0 || d.status === 'active_rental');
      if (allProfitable) {
        await tryAward('perfectionist');
      }
    }
  }

  return awardedTrophies;
}

interface FlipSaleResult {
  salePrice: number;
  profit: number;
  curveball?: {
    name: string;
    description: string;
    cashImpact: number;
    emoji?: string;
  };
  newCash: number;
}

interface RentalIncomeResult {
  weeklyIncome: number;
  curveball?: {
    name: string;
    description: string;
    cashImpact: number;
    emoji?: string;
  };
  newCash: number;
  dealId: number;
}

interface WeekProgressionResult {
  rentalPayments: RentalIncomeResult[];
  completedFlips: FlipSaleResult[];
  curveballs: any[];
  newWeek: number;
  weeksRemaining: number;
}

/**
 * Complete a flip deal and return proceeds to player's balance
 */
export async function completeFlipDeal(
  deal: Deal,
  gameRun: GameRun,
  curveball?: any
): Promise<FlipSaleResult> {
  const proFormaOutputs = deal.proFormaOutputs as any;

  // Base sale price from pro forma
  let salePrice = proFormaOutputs.arv || 0;
  let cashImpact = curveball?.cashImpact || 0;

  // Apply curveball bonus/penalty
  if (curveball) {
    salePrice += cashImpact;

    // Record curveball event
    await db.insert(schema.curveballEvents).values({
      gameRunId: gameRun.id,
      dealId: deal.id,
      curveballId: curveball.id,
      name: curveball.name,
      type: curveball.type,
      description: curveball.description,
      cashImpact: curveball.cashImpact,
      timeImpact: curveball.timeImpact || 0,
      emoji: curveball.emoji,
      gameWeek: gameRun.currentWeek,
    });
  }

  // Calculate profit (sale price - all-in cost)
  const allInCost = proFormaOutputs.allInBasis || 0;
  const profit = salePrice - allInCost;

  // Create ledger entry for sale proceeds
  const ledgerEntry: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'> = {
    direction: 'credit',
    category: 'income',
    amount: salePrice,
    description: curveball
      ? `Flip sale proceeds - ${deal.propertyId} ${curveball.emoji || ''} ${curveball.name}`
      : `Flip sale proceeds - ${deal.propertyId}`,
    propertyId: deal.propertyId,
    dealId: deal.id,
  };

  const { newCash } = await storage.createLedgerEntriesWithCashUpdate(
    gameRun.id,
    [ledgerEntry],
    gameRun.cash
  );

  // Update deal status
  await storage.updateDeal(deal.id, {
    status: 'completed',
    actualProfit: profit,
  });

  // Update profitable deals count if profit > 0
  if (profit > 0) {
    await storage.updateGameRun(gameRun.id, {
      profitableDeals: gameRun.profitableDeals + 1,
    });
  }

  // Award trophies for deal completion
  try {
    const player = await storage.getOrCreatePlayer(gameRun.playerName);
    await checkAndAwardTrophies(player.id, gameRun.id, {
      dealCompleted: true,
      dealProfit: profit,
      dealStrategy: 'flip',
    });
  } catch (err) {
    console.error('Error awarding trophies:', err);
  }

  return {
    salePrice,
    profit,
    curveball: curveball ? {
      name: curveball.name,
      description: curveball.description,
      cashImpact: curveball.cashImpact,
      emoji: curveball.emoji,
    } : undefined,
    newCash,
  };
}

/**
 * Process weekly rental income for an active rental property
 */
export async function processRentalIncome(
  deal: Deal,
  gameRun: GameRun,
  curveball?: any
): Promise<RentalIncomeResult> {
  // Get weekly income from deal (should be pre-calculated)
  let weeklyIncome = deal.weeklyIncome || 0;
  let cashImpact = curveball?.cashImpact || 0;
  let actualIncome = weeklyIncome + cashImpact;

  // Handle curveballs that affect rent
  if (curveball?.rentMultiplier !== undefined) {
    actualIncome = weeklyIncome * curveball.rentMultiplier;
  }

  // Record curveball event if one occurred
  if (curveball) {
    await db.insert(schema.curveballEvents).values({
      gameRunId: gameRun.id,
      dealId: deal.id,
      curveballId: curveball.id,
      name: curveball.name,
      type: curveball.type,
      description: curveball.description,
      cashImpact: curveball.cashImpact || 0,
      timeImpact: curveball.timeImpact || 0,
      emoji: curveball.emoji,
      gameWeek: gameRun.currentWeek,
    });
  }

  // Create ledger entry for rental income
  const ledgerEntry: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'> = {
    direction: 'credit',
    category: 'income',
    amount: actualIncome,
    description: curveball
      ? `Weekly rent - ${deal.propertyId} ${curveball.emoji || ''} ${curveball.name}`
      : `Weekly rent payment - ${deal.propertyId}`,
    propertyId: deal.propertyId,
    dealId: deal.id,
  };

  const { newCash } = await storage.createLedgerEntriesWithCashUpdate(
    gameRun.id,
    [ledgerEntry],
    gameRun.cash
  );

  // Update deal's last payment week
  await storage.updateDeal(deal.id, {
    lastIncomePaymentWeek: gameRun.currentWeek,
  });

  return {
    weeklyIncome: actualIncome,
    curveball: curveball ? {
      name: curveball.name,
      description: curveball.description,
      cashImpact: curveball.cashImpact || 0,
      emoji: curveball.emoji,
    } : undefined,
    newCash,
    dealId: deal.id,
  };
}

/**
 * Progress the game by one week
 * - Pays out rental income for active rentals
 * - Advances flip timelines and completes ready flips
 * - Triggers curveball events
 */
export async function advanceGameWeek(gameRunId: number): Promise<WeekProgressionResult> {
  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) {
    throw new Error('Game run not found');
  }

  if (gameRun.weeksRemaining <= 0) {
    throw new Error('Game time has expired');
  }

  const deals = await storage.getDealsByGameRun(gameRunId);
  const rentalPayments: RentalIncomeResult[] = [];
  const completedFlips: FlipSaleResult[] = [];
  const curveballs: any[] = [];

  // Process active rental deals - pay weekly income
  for (const deal of deals) {
    if (deal.status === 'active_rental') {
      // Check if it's time for payment (hasn't been paid this week)
      if ((deal.lastIncomePaymentWeek || 0) < gameRun.currentWeek + 1) {
        // Roll for curveball events (rental_monthly trigger)
        const curveball = rollForCurveball('rental_monthly');

        const result = await processRentalIncome(deal, gameRun, curveball || undefined);
        rentalPayments.push(result);

        if (curveball) {
          curveballs.push(curveball);
        }
      }
    }
  }

  // Process flips in rehab - count down weeks
  for (const deal of deals) {
    if (deal.status === 'in_rehab' && deal.weeksUntilCompletion) {
      const weeksLeft = deal.weeksUntilCompletion - 1;

      if (weeksLeft <= 0) {
        // Flip is complete! Time to sell
        // Roll for curveball events (flip_at_sale trigger)
        const curveball = rollForCurveball('flip_at_sale');

        const result = await completeFlipDeal(deal, gameRun, curveball || undefined);
        completedFlips.push(result);

        if (curveball) {
          curveballs.push(curveball);
        }
      } else {
        // Update weeks remaining
        await storage.updateDeal(deal.id, {
          weeksUntilCompletion: weeksLeft,
        });
      }
    }
  }

  // Advance game week
  const newWeek = gameRun.currentWeek + 1;
  const newWeeksRemaining = gameRun.weeksRemaining - 1;

  await storage.updateGameRun(gameRunId, {
    currentWeek: newWeek,
    weeksRemaining: newWeeksRemaining,
  });

  return {
    rentalPayments,
    completedFlips,
    curveballs,
    newWeek,
    weeksRemaining: newWeeksRemaining,
  };
}

/**
 * Calculate weekly rental income from monthly cash flow
 * (Monthly cash flow / 4.33 weeks per month)
 */
export function calculateWeeklyIncome(monthlyCashFlow: number): number {
  return Math.floor(monthlyCashFlow / 4.33);
}

/**
 * Activate a rental property after leasing period
 * Sets up weekly income and marks as active
 */
export async function activateRentalProperty(
  deal: Deal,
  gameRun: GameRun,
  monthlyCashFlow: number
): Promise<Deal> {
  const weeklyIncome = calculateWeeklyIncome(monthlyCashFlow);

  const updatedDeal = await storage.updateDeal(deal.id, {
    status: 'active_rental',
    weeklyIncome,
    lastIncomePaymentWeek: gameRun.currentWeek,
  });

  // Award trophies for rental activation
  try {
    const player = await storage.getOrCreatePlayer(gameRun.playerName);
    await checkAndAwardTrophies(player.id, gameRun.id, {
      dealCompleted: true,
      dealStrategy: 'rental',
    });
  } catch (err) {
    console.error('Error awarding trophies:', err);
  }

  return updatedDeal!;
}

/**
 * Start a flip rehab period
 * Sets deal to in_rehab status and tracks completion timeline
 */
export async function startFlipRehab(
  deal: Deal,
  rehabWeeks: number
): Promise<Deal> {
  const updatedDeal = await storage.updateDeal(deal.id, {
    status: 'in_rehab',
    weeksUntilCompletion: rehabWeeks,
  });

  return updatedDeal!;
}
