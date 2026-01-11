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
  grossRent: number;
  totalExpenses: number;
  vacancyLoss: number;
  vacancyRate: number;
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
 * Uses pre-calculated values from activation for consistency
 * Shows gross rent, vacancy, operating expenses, debt service, and reality check separately
 */
export async function processRentalIncome(
  deal: Deal,
  gameRun: GameRun,
  curveball?: any
): Promise<RentalIncomeResult> {
  const proFormaOutputs = deal.proFormaOutputs as any;
  const proFormaInputs = deal.proFormaInputs as any;
  const weeksPerMonth = 4.33;
  
  // Use the stored weeklyIncome as the authoritative net value
  const storedWeeklyIncome = deal.weeklyIncome || 0;
  
  // Use pre-stored values from activation (if available)
  let monthlyGrossRent = proFormaOutputs?.monthlyGrossRent || 0;
  let monthlyVacancyLoss = proFormaOutputs?.monthlyVacancyLoss || 0;
  let monthlyOperatingExpenses = proFormaOutputs?.monthlyOperatingExpenses || 0;
  let monthlyDebtService = proFormaOutputs?.monthlyDebtService || proFormaOutputs?.debtServiceMonthly || 0;
  let realityAdjustmentMonthly = proFormaOutputs?.realityAdjustmentMonthly || 0;
  
  // Handle legacy rentals: if stored fields are missing, derive from stored inputs
  if (monthlyGrossRent === 0 && storedWeeklyIncome) {
    // Fallback: reconstruct from stored pro forma inputs
    monthlyGrossRent = proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0;
    monthlyDebtService = proFormaOutputs?.debtServiceMonthly || 0;
    
    // Calculate vacancy from stored inputs (not hardcoded)
    const playerVacancy = proFormaInputs?.vacancyRate || 5;
    const landlordPays = proFormaInputs?.utilities === true;
    const vacancyPenalty = landlordPays ? 0 : 1.92; // tenant pays = +1 week
    const effectiveVacancy = playerVacancy + vacancyPenalty;
    monthlyVacancyLoss = monthlyGrossRent * (effectiveVacancy / 100);
    
    // Derive operating expenses to maintain original cash flow
    // cashFlow = grossRent - vacancy - opex - debtService
    // So: opex = grossRent - vacancy - debtService - cashFlow
    const playerCashFlowMonthly = proFormaOutputs?.cashFlowMonthly || 0;
    monthlyOperatingExpenses = Math.max(0, monthlyGrossRent - monthlyVacancyLoss - monthlyDebtService - playerCashFlowMonthly);
    
    // Get reality adjustment from stored reality check data
    const storedRealityCheck = proFormaOutputs?.realityCheck;
    if (storedRealityCheck) {
      realityAdjustmentMonthly = (storedRealityCheck.actualCashFlow || 0) - (storedRealityCheck.projectedCashFlow || 0);
    }
  }
  
  // Convert to weekly values for display purposes
  const weeklyGrossRent = Math.max(0, Math.floor(monthlyGrossRent / weeksPerMonth));
  const weeklyVacancyLoss = Math.max(0, Math.floor(monthlyVacancyLoss / weeksPerMonth));
  const weeklyOperatingExpenses = Math.max(0, Math.floor(monthlyOperatingExpenses / weeksPerMonth));
  const weeklyDebtService = Math.max(0, Math.floor(monthlyDebtService / weeksPerMonth));
  
  // Calculate curveball effects
  let cashImpact = curveball?.cashImpact || 0;
  const rentMultiplier = curveball?.rentMultiplier ?? 1;
  
  // Apply rent multiplier to rent-related components only
  // This is economically correct: rent curveballs affect rent collection, not fixed costs
  const scaledGrossRent = Math.round(weeklyGrossRent * rentMultiplier);
  const scaledVacancyLoss = Math.round(weeklyVacancyLoss * rentMultiplier); // Vacancy tied to rent
  
  // Fixed costs don't change with rent curveballs
  const fixedOperatingExpenses = weeklyOperatingExpenses;
  const fixedDebtService = weeklyDebtService;
  
  // Reality check adjustment (weekly): negative = player was optimistic, positive = conservative
  // This reflects the difference between player's rent/vacancy assumptions and market reality
  // Use Math.round for precision, and scale by rentMultiplier (no rent = no reality check applies)
  const baseWeeklyRealityAdjustment = Math.round(realityAdjustmentMonthly / weeksPerMonth);
  const weeklyRealityAdjustment = Math.round(baseWeeklyRealityAdjustment * rentMultiplier);
  
  // Calculate actual net weekly income from components
  // This is the TRUE cash impact: rent - vacancy - opex - debt + reality adjustment + curveball cash
  // For legacy rentals, use storedWeeklyIncome if component breakdown is incomplete
  const componentBasedNet = scaledGrossRent - scaledVacancyLoss - fixedOperatingExpenses - fixedDebtService + weeklyRealityAdjustment + cashImpact;
  
  // Use component-based calculation if we have the breakdown, otherwise fall back to stored value with curveball effects
  const hasCompleteBreakdown = monthlyGrossRent > 0 || monthlyVacancyLoss > 0 || monthlyOperatingExpenses > 0 || monthlyDebtService > 0;
  const legacyNet = Math.round(storedWeeklyIncome * rentMultiplier) + cashImpact;
  const netWeeklyIncome = hasCompleteBreakdown ? componentBasedNet : legacyNet;
  
  // Calculate total expenses for display
  const totalWeeklyExpenses = scaledVacancyLoss + fixedOperatingExpenses + fixedDebtService;

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

  // Get property name for descriptions
  const property = await storage.getProperty(deal.propertyId);
  const propertyName = property?.name || `Property #${deal.propertyId}`;
  
  // Create granular ledger entries for educational value
  const ledgerEntries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[] = [];
  
  // Get vacancy rate for description
  const vacancyRate = proFormaOutputs?.effectiveVacancyRate?.toFixed(1) || '?';
  
  // Ledger entries sum to exactly netWeeklyIncome by construction:
  // rent - vacancy - opex - debt + cashImpact = netWeeklyIncome
  // (verified: we calculated netWeeklyIncome from these same components above)
  
  // Credit: Gross rent income
  if (scaledGrossRent > 0) {
    ledgerEntries.push({
      direction: 'credit',
      category: 'income',
      amount: scaledGrossRent,
      description: curveball
        ? `🏠 Rent - ${propertyName} ${curveball.emoji || ''} ${curveball.name}`
        : `🏠 Weekly rent - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }
  
  // Debit: Vacancy loss (rent-tied, scales with rent)
  if (scaledVacancyLoss > 0) {
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: scaledVacancyLoss,
      description: `🏚️ Vacancy (${vacancyRate}%) - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }
  
  // Debit: Operating expenses (fixed - taxes, insurance, maintenance, etc.)
  if (fixedOperatingExpenses > 0) {
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: fixedOperatingExpenses,
      description: `📊 Operating costs - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }
  
  // Debit: Debt service (fixed - mortgage payment)
  if (fixedDebtService > 0) {
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: fixedDebtService,
      description: `🏦 Mortgage - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }
  
  // Reality check adjustment (optimistic = penalty, conservative = bonus)
  if (weeklyRealityAdjustment !== 0) {
    if (weeklyRealityAdjustment > 0) {
      // Player was conservative - their actual cash flow is HIGHER
      ledgerEntries.push({
        direction: 'credit',
        category: 'income',
        amount: weeklyRealityAdjustment,
        description: `📈 Conservative bonus - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
      });
    } else {
      // Player was optimistic - their actual cash flow is LOWER
      ledgerEntries.push({
        direction: 'debit',
        category: 'expense',
        amount: Math.abs(weeklyRealityAdjustment),
        description: `📉 Reality check - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
      });
    }
  }
  
  // Curveball cash impact (if any)
  if (cashImpact !== 0) {
    if (cashImpact > 0) {
      ledgerEntries.push({
        direction: 'credit',
        category: 'income',
        amount: cashImpact,
        description: `${curveball?.emoji || '🎲'} ${curveball?.name || 'Curveball'} - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
      });
    } else {
      ledgerEntries.push({
        direction: 'debit',
        category: 'expense',
        amount: Math.abs(cashImpact),
        description: `${curveball?.emoji || '🎲'} ${curveball?.name || 'Curveball'} - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
      });
    }
  }
  

  // Fetch current cash balance to avoid stale data issues
  const currentGameRun = await storage.getGameRun(gameRun.id);
  const currentCash = currentGameRun?.cash ?? gameRun.cash;

  const { newCash } = await storage.createLedgerEntriesWithCashUpdate(
    gameRun.id,
    ledgerEntries,
    currentCash
  );

  // Update deal's last payment week
  await storage.updateDeal(deal.id, {
    lastIncomePaymentWeek: gameRun.currentWeek,
  });

  return {
    weeklyIncome: netWeeklyIncome,
    grossRent: scaledGrossRent, // After rent multiplier applied
    totalExpenses: totalWeeklyExpenses,
    vacancyLoss: scaledVacancyLoss, // After rent multiplier applied
    vacancyRate: proFormaOutputs?.effectiveVacancyRate || 0,
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
 * Reality Check Model
 * 
 * Compares player's pro forma assumptions against property's "true" market values.
 * Returns reality-adjusted cash flow that reflects actual market conditions.
 * 
 * True values are derived from:
 * - Rent: Midpoint of property's rent range (market study reveals this)
 * - Vacancy: Location-based baseline (urban 7%, suburban 5%)
 */
interface RealityCheckResult {
  projectedCashFlow: number;      // What player thought they'd get
  actualCashFlow: number;         // What market actually delivers
  rentDelta: number;              // Difference in rent assumption vs reality
  vacancyDelta: number;           // Difference in vacancy assumption vs reality
  explanation: string;            // Human-readable feedback
  wasOptimistic: boolean;         // Did player assume too rosy a picture?
}

export function calculateRealityCheck(
  property: { rentMin: number; rentMax: number; locationType: string },
  playerInputs: { monthlyRent: number; vacancyRate: number },
  playerProjectedCashFlow: number,
  completedDiligence: string[]
): RealityCheckResult {
  // True market rent is the midpoint of the property's range
  const trueMarketRent = Math.floor((property.rentMin + property.rentMax) / 2);
  
  // True vacancy rate based on location (urban markets have higher turnover)
  const trueVacancyRate = property.locationType === 'urban' ? 7 : 5;
  
  // Calculate deltas (player assumption - reality)
  const rentDelta = playerInputs.monthlyRent - trueMarketRent;
  const vacancyDelta = playerInputs.vacancyRate - trueVacancyRate;
  
  // Did player do market study? If so, rent assumption is more accurate
  const hasMarketStudy = completedDiligence.includes('market_study');
  
  // Calculate the income impact from rent difference
  // If player assumed $1500 rent but market is $1300, they lose $200/month
  // If player assumed $1200 rent but market is $1400, they gain $200/month (conservative win!)
  let rentImpact = 0;
  if (!hasMarketStudy) {
    if (rentDelta > 0) {
      // Optimistic: assumed higher rent than market - hurts cash flow
      rentImpact = -rentDelta;
    } else if (rentDelta < 0) {
      // Conservative: assumed lower rent than market - bonus cash flow!
      rentImpact = Math.abs(rentDelta);
    }
  }
  
  // Calculate vacancy impact
  // If player assumed 5% but reality is 7%, that's 2% more vacancy (hurts)
  // If player assumed 10% but reality is 7%, that's 3% less vacancy (helps!)
  let vacancyImpact = 0;
  if (vacancyDelta < 0) {
    // Player assumed less vacancy than reality - more lost rent
    const additionalVacancy = Math.abs(vacancyDelta) / 100;
    vacancyImpact = -Math.floor(trueMarketRent * additionalVacancy);
  } else if (vacancyDelta > 0) {
    // Player assumed more vacancy than reality - bonus from lower actual vacancy!
    const lessVacancy = vacancyDelta / 100;
    vacancyImpact = Math.floor(trueMarketRent * lessVacancy);
  }
  
  // Total monthly impact
  const totalMonthlyImpact = rentImpact + vacancyImpact;
  const actualCashFlow = playerProjectedCashFlow + totalMonthlyImpact;
  
  // Build explanation
  const negativeExplanationParts: string[] = [];
  const positiveExplanationParts: string[] = [];
  
  if (rentImpact < 0) {
    negativeExplanationParts.push(`Rent is $${Math.abs(rentDelta)}/mo lower than assumed`);
  } else if (rentImpact > 0) {
    positiveExplanationParts.push(`Market rent is $${Math.abs(rentDelta)}/mo higher than you assumed`);
  }
  
  if (vacancyImpact < 0) {
    negativeExplanationParts.push(`${Math.abs(vacancyDelta)}% higher vacancy than expected`);
  } else if (vacancyImpact > 0) {
    positiveExplanationParts.push(`${vacancyDelta}% lower vacancy than you budgeted`);
  }
  
  const wasOptimistic = totalMonthlyImpact < 0;
  const wasConservative = totalMonthlyImpact > 0;
  
  let explanation = '';
  if (wasOptimistic) {
    explanation = `Reality check: ${negativeExplanationParts.join(', ')}. Actual cash flow is $${Math.abs(totalMonthlyImpact)}/mo less than projected.`;
  } else if (wasConservative) {
    explanation = `Conservative win! ${positiveExplanationParts.join(', ')}. Cash flow is $${totalMonthlyImpact}/mo better than projected.`;
  } else {
    explanation = 'Your assumptions match market reality.';
  }
  
  return {
    projectedCashFlow: playerProjectedCashFlow,
    actualCashFlow,
    rentDelta,
    vacancyDelta,
    explanation,
    wasOptimistic,
  };
}

/**
 * Activate a rental property after leasing period
 * Sets up weekly income and marks as active
 * Now includes reality check - comparing player assumptions to market reality
 */
interface RentalActivationResult {
  deal: Deal;
  surpriseCosts: number;
  surpriseIssues: string[];
  newCash: number;
  realityCheck?: RealityCheckResult;
}

export async function activateRentalProperty(
  deal: Deal,
  gameRun: GameRun,
  monthlyCashFlow: number
): Promise<RentalActivationResult> {
  // Get property to check for undiscovered issues and reality check
  const property = await storage.getProperty(deal.propertyId);
  const investigations = await storage.getPropertyInvestigations(gameRun.id);
  const completedDiligence = investigations
    .filter(inv => inv.propertyId === deal.propertyId)
    .map(inv => inv.investigationType);
  
  // Extract player inputs from stored pro forma
  const proFormaInputs = deal.proFormaInputs as any;
  // Note: Client uses 'expectedRent', not 'monthlyRent'
  const playerMonthlyRent = proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0;
  const playerVacancyRate = proFormaInputs?.vacancyRate || 5;
  
  // Perform reality check - compare player assumptions to market reality
  let realityCheck: RealityCheckResult | undefined;
  let actualMonthlyCashFlow = monthlyCashFlow;
  
  if (property && playerMonthlyRent > 0) {
    realityCheck = calculateRealityCheck(
      {
        rentMin: property.rentMin,
        rentMax: property.rentMax,
        locationType: property.locationType,
      },
      {
        monthlyRent: playerMonthlyRent,
        vacancyRate: playerVacancyRate,
      },
      monthlyCashFlow,
      completedDiligence
    );
    
    // Use reality-adjusted cash flow for weekly income
    actualMonthlyCashFlow = realityCheck.actualCashFlow;
  }
  
  const weeklyIncome = calculateWeeklyIncome(actualMonthlyCashFlow);
  
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
  
  // Store breakdown for weekly processing based on pro forma outputs
  // The pro forma already calculates: grossRent - expenses - debtService = cashFlowMonthly
  // We use the stored values and apply reality check as an adjustment
  const proFormaOutputs = deal.proFormaOutputs as any;
  
  // Use player's projected rent (before vacancy) from inputs
  const monthlyGrossRent = proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0;
  
  // === VACANCY TRACKING (unique per property) ===
  // Base vacancy rate from player's assumption
  const playerBaseVacancyRate = proFormaInputs?.vacancyRate || 5;
  
  // Tenant pays utilities penalty: +1 week vacancy = +1.92% (1/52 weeks)
  // In pro forma: utilities = true means LANDLORD pays, utilities = false means TENANT pays
  // TENANT pays = harder to find tenants = +1 week vacancy penalty
  const landlordPaysUtils = proFormaInputs?.utilities === true;
  const tenantPaysUtilities = !landlordPaysUtils;
  const utilityVacancyPenalty = tenantPaysUtilities ? 1.92 : 0;
  
  // Market reality vacancy (urban 7%, suburban 5%) - applied if player didn't do market study
  const didMarketStudy = completedDiligence.includes('market_study');
  const marketVacancyRate = property?.locationType === 'urban' ? 7 : 5;
  
  // Effective vacancy rate for this property
  // If player did market study: use market rate, otherwise: use player's rate
  // Always add utility penalty if tenant pays utilities
  let effectiveVacancyRate = didMarketStudy ? marketVacancyRate : playerBaseVacancyRate;
  effectiveVacancyRate += utilityVacancyPenalty;
  
  // Calculate monthly vacancy loss for this specific property
  const monthlyVacancyLoss = monthlyGrossRent * (effectiveVacancyRate / 100);
  
  // Calculate other operating expenses (without vacancy or debt service - they're separate)
  const taxesAnnual = proFormaInputs?.taxesAnnual || 0;
  const insuranceAnnual = proFormaInputs?.insuranceAnnual || 0;
  const maintenancePct = proFormaInputs?.maintenancePct || 5;
  const capexPct = proFormaInputs?.capexPct || 5;
  const hasPropertyMgmt = proFormaInputs?.propertyManagement || false;
  const landlordPaysUtilities = proFormaInputs?.utilities || false;
  const utilitiesMonthly = proFormaInputs?.utilitiesMonthly || 150;
  const debtServiceMonthly = proFormaOutputs?.debtServiceMonthly || 0;
  
  const monthlyTaxes = taxesAnnual / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMaintenance = monthlyGrossRent * (maintenancePct / 100);
  const monthlyCapex = monthlyGrossRent * (capexPct / 100);
  const monthlyMgmt = hasPropertyMgmt ? monthlyGrossRent * (proFormaInputs?.propertyManagementPct || 10) / 100 : 0;
  const monthlyUtilitiesCost = landlordPaysUtilities ? utilitiesMonthly : 0;
  
  // Operating expenses (NOT including vacancy or debt service - they're tracked separately)
  const monthlyOperatingExpenses = monthlyTaxes + monthlyInsurance + monthlyMaintenance + 
    monthlyCapex + monthlyMgmt + monthlyUtilitiesCost;
  
  // Reality check adjustment (negative = player was optimistic, positive = conservative)
  const realityAdjustmentMonthly = realityCheck 
    ? (realityCheck.actualCashFlow - realityCheck.projectedCashFlow)
    : 0;
  
  // Store expense breakdown for weekly processing
  const updatedProFormaOutputs = {
    ...proFormaOutputs,
    surpriseCosts,
    totalCashInvested: (proFormaOutputs?.totalCashInvested || 0) + surpriseCosts,
    // Vacancy tracking (unique per property)
    playerBaseVacancyRate,
    utilityVacancyPenalty,
    marketVacancyRate,
    effectiveVacancyRate,
    monthlyVacancyLoss,
    // Expense breakdown (separate categories)
    monthlyOperatingExpenses,  // taxes, insurance, maintenance, capex, mgmt, utilities
    monthlyDebtService: debtServiceMonthly,  // mortgage payment
    // Reality check data
    realityCheck: realityCheck ? {
      projectedCashFlow: realityCheck.projectedCashFlow,
      actualCashFlow: realityCheck.actualCashFlow,
      rentDelta: realityCheck.rentDelta,
      vacancyDelta: realityCheck.vacancyDelta,
      explanation: realityCheck.explanation,
      wasOptimistic: realityCheck.wasOptimistic,
    } : null,
    // Store values for weekly processing
    monthlyGrossRent,
    realityAdjustmentMonthly,
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
    realityCheck,
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
