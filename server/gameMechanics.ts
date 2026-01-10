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
import { getUndiscoveredIssues, calculateSurpriseCosts, PropertyIssue } from '@shared/propertyIssues';

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

    // Millionaire - Earn $500K total profit across all games (cumulative)
    const player = await storage.getOrCreatePlayer(gameRun.playerName);
    // Calculate new cumulative profit after this game
    const thisGameProfit = completedDeals.reduce((sum, d) => sum + (d.actualProfit || 0), 0);
    const cumulativeProfit = player.totalProfitEarned + Math.max(0, thisGameProfit);
    if (cumulativeProfit >= 500000) {
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
  surpriseCosts: number;
  surpriseIssues: string[];
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
 * Sale price is calculated based on:
 * 1. Whether player did comp analysis (appraisal) - reduces uncertainty
 * 2. Rehab investment relative to property requirements
 * 
 * WITH comps: Sale price is within actual market range (arvMin-arvMax)
 * WITHOUT comps: Sale price can deviate significantly from player's estimate!
 */
export async function completeFlipDeal(
  deal: Deal,
  gameRun: GameRun,
  curveball?: any
): Promise<FlipSaleResult> {
  const proFormaOutputs = deal.proFormaOutputs as any;
  const proFormaInputs = deal.proFormaInputs as any;

  // Get property to access ARV and rehab ranges
  const property = await storage.getProperty(deal.propertyId);
  
  // Check if player did due diligence (appraisal = comp analysis)
  const investigations = await storage.getPropertyInvestigations(gameRun.id);
  const completedDiligence = investigations
    .filter(inv => inv.propertyId === deal.propertyId)
    .map(inv => inv.investigationType);
  const didComps = completedDiligence.includes('appraisal');
  
  // Check for undiscovered property issues (surprise repair costs!)
  const propertyName = property?.name || '';
  const undiscoveredIssues = getUndiscoveredIssues(propertyName, completedDiligence);
  const surpriseCosts = undiscoveredIssues.length > 0 ? calculateSurpriseCosts(undiscoveredIssues) : 0;
  
  // Calculate sale price based on due diligence and rehab investment
  let salePrice: number;
  if (property && property.arvMin && property.arvMax && property.rehabMin && property.rehabMax) {
    // Get player's actual rehab spend (budget + contingency)
    const rehabBudget = proFormaInputs?.rehabBudget || 0;
    const contingencyPct = proFormaInputs?.contingencyPct || 10;
    const actualRehabSpend = rehabBudget * (1 + contingencyPct / 100);
    
    // Calculate rehab completion factor (0 to 1)
    const rehabRange = property.rehabMax - property.rehabMin;
    const completionFactor = rehabRange > 0 
      ? Math.max(0, Math.min(1, (actualRehabSpend - property.rehabMin) / rehabRange))
      : 0.5;
    
    if (didComps) {
      // WITH COMPS: Sale price is reliably within actual market range
      // Base sale price scales with rehab completion within the known range
      const arvRange = property.arvMax - property.arvMin;
      const baseSalePrice = property.arvMin + (completionFactor * arvRange);
      
      // Apply small ±5% market variance
      const marketVariance = 0.95 + (Math.random() * 0.10);
      salePrice = Math.round(baseSalePrice * marketVariance);
    } else {
      // WITHOUT COMPS: Player is flying blind! Market reality may differ wildly
      // Their estimate could be off by 15-30% in either direction
      const playerEstimate = proFormaInputs?.arv || ((property.arvMin + property.arvMax) / 2);
      
      // Generate a "reality check" - what the market actually values this at
      // Could be 70% to 130% of what player expected
      const realityFactor = 0.70 + (Math.random() * 0.60); // 0.70 to 1.30
      
      // Rehab still matters for final price, but uncertainty is huge
      const baseFromRehab = property.arvMin + (completionFactor * (property.arvMax - property.arvMin));
      
      // Blend player estimate (with uncertainty) and actual value
      // Without comps, the market may not agree with player's assumptions
      const uncertainPrice = playerEstimate * realityFactor;
      
      // Final price leans toward uncertain estimate since player didn't research
      salePrice = Math.round((uncertainPrice * 0.7) + (baseFromRehab * 0.3));
    }
  } else {
    // Fallback to pro forma ARV if property not found
    salePrice = proFormaOutputs.arv || 0;
  }
  
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

  // Calculate profit (sale price - all-in cost - surprise repair costs)
  // Surprise costs are also reflected in ledger debit, which correctly updates cash.
  // Both systems track this expense: ledger for cash flow, profit for ROI metrics.
  // This is not double-counting because:
  // - Ledger tracks cash balance: +salePrice - surpriseCosts
  // - Profit tracks ROI: salePrice - allInCost - surpriseCosts
  // allInCost was the player's total investment (including rehab budget they committed to)
  // surpriseCosts are ADDITIONAL expenses discovered during flip
  const allInCost = proFormaOutputs.allInBasis || 0;
  const profit = salePrice - allInCost - surpriseCosts;

  // Create ledger entries - sale proceeds and any surprise costs
  const ledgerEntries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[] = [];
  
  // Sale proceeds entry
  ledgerEntries.push({
    direction: 'credit',
    category: 'income',
    amount: salePrice,
    description: curveball
      ? `Flip sale proceeds - ${deal.propertyId} ${curveball.emoji || ''} ${curveball.name}`
      : `Flip sale proceeds - ${deal.propertyId}`,
    propertyId: deal.propertyId,
    dealId: deal.id,
  });
  
  // Surprise repair costs entry (if any undiscovered issues)
  if (surpriseCosts > 0) {
    const issueNames = undiscoveredIssues.map(i => i.name).join(', ');
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: surpriseCosts,
      description: `⚠️ Surprise repairs discovered: ${issueNames}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }

  // Fetch current cash balance to avoid stale data issues
  const currentGameRun = await storage.getGameRun(gameRun.id);
  const currentCash = currentGameRun?.cash ?? gameRun.cash;

  const { newCash } = await storage.createLedgerEntriesWithCashUpdate(
    gameRun.id,
    ledgerEntries,
    currentCash
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
    surpriseCosts,
    surpriseIssues: undiscoveredIssues.map(i => i.name),
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

  // Fetch current cash balance to avoid stale data issues
  const currentGameRun = await storage.getGameRun(gameRun.id);
  const currentCash = currentGameRun?.cash ?? gameRun.cash;

  const { newCash } = await storage.createLedgerEntriesWithCashUpdate(
    gameRun.id,
    [ledgerEntry],
    currentCash
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
interface RentalActivationResult {
  deal: Deal;
  surpriseCosts: number;
  surpriseIssues: string[];
  newCash: number;
}

export async function activateRentalProperty(
  deal: Deal,
  gameRun: GameRun,
  monthlyCashFlow: number
): Promise<RentalActivationResult> {
  const weeklyIncome = calculateWeeklyIncome(monthlyCashFlow);
  
  // Get property to check for undiscovered issues
  const property = await storage.getProperty(deal.propertyId);
  const investigations = await storage.getPropertyInvestigations(gameRun.id);
  const completedDiligence = investigations
    .filter(inv => inv.propertyId === deal.propertyId)
    .map(inv => inv.investigationType);
  
  // Check for undiscovered property issues (surprise repair costs!)
  const propertyName = property?.name || '';
  const undiscoveredIssues = getUndiscoveredIssues(propertyName, completedDiligence);
  const surpriseCosts = undiscoveredIssues.length > 0 ? calculateSurpriseCosts(undiscoveredIssues) : 0;
  
  // Create ledger entry for surprise repair costs if any
  let newCash = gameRun.cash;
  if (surpriseCosts > 0) {
    const issueNames = undiscoveredIssues.map(i => i.name).join(', ');
    const ledgerEntry: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'> = {
      direction: 'debit',
      category: 'expense',
      amount: surpriseCosts,
      description: `⚠️ Surprise repairs discovered: ${issueNames}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    };
    
    const currentGameRun = await storage.getGameRun(gameRun.id);
    const currentCash = currentGameRun?.cash ?? gameRun.cash;
    
    const result = await storage.createLedgerEntriesWithCashUpdate(
      gameRun.id,
      [ledgerEntry],
      currentCash
    );
    newCash = result.newCash;
  }
  
  // Update pro forma outputs to include surprise costs in total investment
  const proFormaOutputs = deal.proFormaOutputs as any;
  const updatedProFormaOutputs = {
    ...proFormaOutputs,
    surpriseCosts,
    totalCashInvested: (proFormaOutputs?.totalCashInvested || 0) + surpriseCosts,
  };

  const updatedDeal = await storage.updateDeal(deal.id, {
    status: 'active_rental',
    weeklyIncome,
    lastIncomePaymentWeek: gameRun.currentWeek,
    proFormaOutputs: updatedProFormaOutputs,
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

  return {
    deal: updatedDeal!,
    surpriseCosts,
    surpriseIssues: undiscoveredIssues.map(i => i.name),
    newCash,
  };
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
