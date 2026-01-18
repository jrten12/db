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
import { rollForCurveball, type PropertyContext, normalizeConditionTag, normalizePropertyType, normalizeLocationType } from '../client/src/lib/curveballs';
import { getUndiscoveredIssues, calculateSurpriseCosts, PropertyIssue } from '@shared/propertyIssues';

/**
 * Loan Amortization Utilities
 * 
 * The game runs in 52 weeks, but mortgages are typically 30 years (360 months).
 * We use accelerated amortization for BOOKKEEPING ONLY to make principal paydown 
 * visible during gameplay. Cash payments remain realistic.
 * 
 * Strategy: Player pays realistic weekly debt service (based on monthly payment).
 * The loan balance reduces faster (simulating 5 years of payments in 52 weeks)
 * so players can see equity building. This is educational acceleration only -
 * it doesn't affect the actual cash flow, which uses standard mortgage math.
 */

// Game time compression factor for principal reduction (bookkeeping only)
// 52 game weeks simulate ~5 years of real mortgage amortization
const MORTGAGE_ACCELERATION_FACTOR = 5; // 1 game week = 5 weeks of principal paydown

interface AmortizationPayment {
  totalPayment: number;       // Total monthly payment (P&I)
  interestPayment: number;    // Interest portion
  principalPayment: number;   // Principal portion
  remainingBalance: number;   // Balance after payment
}

/**
 * Calculate monthly mortgage payment using standard amortization formula
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number, // as percentage, e.g., 6.5 for 6.5%
  termMonths: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / termMonths);
  
  const monthlyRate = annualRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment);
}

/**
 * Calculate a single amortization payment breakdown
 */
export function calculateAmortizationPayment(
  currentBalance: number,
  annualRate: number,
  termMonths: number,
  originalPrincipal: number
): AmortizationPayment {
  if (currentBalance <= 0) {
    return { totalPayment: 0, interestPayment: 0, principalPayment: 0, remainingBalance: 0 };
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(originalPrincipal, annualRate, termMonths);
  
  // Interest is calculated on current balance
  const interestPayment = Math.round(currentBalance * monthlyRate);
  
  // Principal is remainder of payment
  const principalPayment = Math.min(monthlyPayment - interestPayment, currentBalance);
  
  // Remaining balance
  const remainingBalance = Math.max(0, currentBalance - principalPayment);
  
  return {
    totalPayment: monthlyPayment,
    interestPayment,
    principalPayment,
    remainingBalance,
  };
}

/**
 * Calculate weekly amortization for game tracking
 * 
 * Returns two sets of values:
 * 1. Cash values: Realistic weekly interest/principal from actual mortgage payment
 * 2. Bookkeeping principal: Accelerated principal reduction for loan balance tracking
 * 
 * The player's cash flow uses the realistic amounts (debtService already handles this).
 * The loan balance uses accelerated principal to show equity building faster.
 */
export function calculateWeeklyPrincipalPayment(
  currentBalance: number,
  annualRate: number,
  termMonths: number,
  originalPrincipal: number
): { weeklyPrincipal: number; weeklyInterest: number; acceleratedPrincipal: number } {
  if (currentBalance <= 0 || annualRate <= 0) {
    return { weeklyPrincipal: 0, weeklyInterest: 0, acceleratedPrincipal: 0 };
  }
  
  // Calculate monthly amortization values
  const amort = calculateAmortizationPayment(currentBalance, annualRate, termMonths, originalPrincipal);
  
  // Convert to weekly (4.33 weeks per month)
  const weeksPerMonth = 4.33;
  const weeklyInterest = Math.round(amort.interestPayment / weeksPerMonth);
  const weeklyPrincipal = Math.round(amort.principalPayment / weeksPerMonth);
  
  // Accelerated principal for loan balance tracking (bookkeeping only, not cash)
  // This simulates multiple months of principal paydown per game week
  const acceleratedPrincipal = Math.min(
    Math.round(weeklyPrincipal * MORTGAGE_ACCELERATION_FACTOR),
    currentBalance
  );
  
  return {
    weeklyPrincipal,        // Realistic principal (matches cash flow)
    weeklyInterest,         // Realistic interest (matches cash flow)
    acceleratedPrincipal,   // Accelerated for loan balance tracking
  };
}

/**
 * Title Issue Types that can occur when skipping title search
 */
const TITLE_ISSUES = [
  { name: 'Unknown lien', minCost: 5000, maxCost: 25000 },
  { name: 'Unpaid property taxes', minCost: 2000, maxCost: 15000 },
  { name: 'Mechanics lien from previous owner', minCost: 3000, maxCost: 20000 },
  { name: 'Boundary dispute resolution', minCost: 5000, maxCost: 35000 },
  { name: 'Easement clearance', minCost: 2000, maxCost: 10000 },
  { name: 'Estate heir claim settlement', minCost: 10000, maxCost: 50000 },
  { name: 'Forged deed in chain of title', minCost: 25000, maxCost: 100000 },
  { name: 'Outstanding HOA liens', minCost: 2000, maxCost: 12000 },
  { name: 'Judgment lien from previous owner', minCost: 8000, maxCost: 40000 },
  { name: 'Unpaid contractor liens', minCost: 4000, maxCost: 18000 },
];

/**
 * Check for title issues when player skipped title search
 * 20% chance of a title issue occurring, with costs ranging $2,000-$100,000
 */
interface TitleIssueResult {
  hasIssue: boolean;
  issueName?: string;
  cost: number;
}

function checkForTitleIssue(didTitleSearch: boolean): TitleIssueResult {
  // If player did title search, no issue occurs
  if (didTitleSearch) {
    return { hasIssue: false, cost: 0 };
  }
  
  // 20% chance of title issue when skipping title search
  const roll = Math.random();
  if (roll > 0.20) {
    return { hasIssue: false, cost: 0 };
  }
  
  // Pick a random title issue
  const issue = TITLE_ISSUES[Math.floor(Math.random() * TITLE_ISSUES.length)];
  
  // Generate random cost within the issue's range
  const cost = Math.round(issue.minCost + Math.random() * (issue.maxCost - issue.minCost));
  
  return {
    hasIssue: true,
    issueName: issue.name,
    cost,
  };
}

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
  titleIssue?: {
    name: string;
    cost: number;
  };
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
    id: string;
    name: string;
    description: string;
    cashImpact: number;
    emoji?: string;
  };
  newCash: number;
  dealId: number;
  // Loan tracking
  principalPaid?: number;
  interestPaid?: number;
  remainingBalance?: number;
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
  let surpriseCosts = undiscoveredIssues.length > 0 ? calculateSurpriseCosts(undiscoveredIssues) : 0;
  
  // Check for title issues (20% chance if title search was skipped)
  const didTitleSearch = completedDiligence.includes('title_search');
  const titleIssue = checkForTitleIssue(didTitleSearch);
  let titleIssueName: string | undefined;
  if (titleIssue.hasIssue) {
    surpriseCosts += titleIssue.cost;
    titleIssueName = titleIssue.issueName;
  }
  
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

  // Calculate holding costs during rehab period
  // These are interest, taxes, and insurance that accrue while property is being renovated
  const interestRate = proFormaInputs?.interestRate || 0;
  const taxesAnnual = proFormaInputs?.taxesAnnual || 0;
  const insuranceAnnual = proFormaInputs?.insuranceAnnual || 0;
  const rehabWeeks = deal.weeksUntilCompletion || proFormaInputs?.rehabWeeks || 0;
  const loanAmount = proFormaOutputs?.loanAmount || 0;

  // Calculate weekly holding costs: interest on loan + property taxes + insurance
  const holdingCostPerWeek = Math.round(
    (loanAmount * (interestRate / 100) / 52) +
    (taxesAnnual / 52) +
    (insuranceAnnual / 52)
  );
  const totalHoldingCosts = holdingCostPerWeek * rehabWeeks;

  // Calculate selling costs (realtor commission, closing costs, etc.)
  const sellingCostsPct = proFormaInputs?.sellingCostsPct || 8; // Default 8% if not specified
  const sellingCosts = Math.round(salePrice * (sellingCostsPct / 100));

  // Calculate profit (sale price - all-in cost - holding costs - selling costs - surprise repair costs)
  // Surprise costs are also reflected in ledger debit, which correctly updates cash.
  // Both systems track this expense: ledger for cash flow, profit for ROI metrics.
  // This is not double-counting because:
  // - Ledger tracks cash balance: +salePrice - surpriseCosts - sellingCosts
  // - Profit tracks ROI: salePrice - allInCost - holdingCosts - sellingCosts - surpriseCosts
  // allInCost was the player's total investment (including rehab budget they committed to)
  // holdingCosts are interest/taxes/insurance that accrued during rehab
  // sellingCosts are realtor commission and closing costs to sell the property
  // surpriseCosts are ADDITIONAL expenses discovered during flip
  const allInCost = proFormaOutputs.allInBasis || 0;
  const profit = salePrice - allInCost - totalHoldingCosts - sellingCosts - surpriseCosts;

  // Create ledger entries - sale proceeds and all selling costs
  const ledgerEntries: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'>[] = [];

  // Sale proceeds entry (gross sale price)
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

  // Holding costs during rehab (interest, taxes, insurance)
  if (totalHoldingCosts > 0) {
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: totalHoldingCosts,
      description: `Holding costs (${rehabWeeks} weeks): interest, taxes, insurance`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }

  // Selling costs (realtor commission, closing costs)
  if (sellingCosts > 0) {
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: sellingCosts,
      description: `Selling costs (${sellingCostsPct}%): realtor, title, closing`,
      propertyId: deal.propertyId,
      dealId: deal.id,
    });
  }

  // Surprise repair costs entry (if any undiscovered issues or title issues)
  if (surpriseCosts > 0) {
    const repairIssueNames = undiscoveredIssues.map(i => i.name);
    const allIssueNames = titleIssueName 
      ? [...repairIssueNames, `Title issue: ${titleIssueName}`]
      : repairIssueNames;
    const issueDescription = allIssueNames.join(', ');
    
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: surpriseCosts,
      description: titleIssueName && repairIssueNames.length === 0
        ? `📜 Title issue discovered: ${titleIssueName}`
        : `⚠️ Issues discovered: ${issueDescription}`,
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

  // Collect all surprise issues for reporting
  const allSurpriseIssues = undiscoveredIssues.map(i => i.name);
  if (titleIssueName) {
    allSurpriseIssues.push(`Title: ${titleIssueName}`);
  }

  return {
    salePrice,
    profit,
    surpriseCosts,
    surpriseIssues: allSurpriseIssues,
    titleIssue: titleIssue.hasIssue ? { name: titleIssueName!, cost: titleIssue.cost } : undefined,
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
  // First try proFormaInputs.expectedRent, then fall back to cashFlowMonthly-based reconstruction
  if (monthlyGrossRent === 0) {
    // Try to get rent from proFormaInputs (the player's rent assumption)
    monthlyGrossRent = proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0;
    
    if (monthlyGrossRent > 0) {
      // We have rent from inputs - calculate expenses from input breakdown
      const playerVacancy = proFormaInputs?.vacancyRate || 5;
      const landlordPays = proFormaInputs?.utilities === true;
      const vacancyPenalty = landlordPays ? 0 : 1.92; // tenant pays = +1 week vacancy penalty
      const effectiveVacancy = playerVacancy + vacancyPenalty;
      monthlyVacancyLoss = monthlyGrossRent * (effectiveVacancy / 100);
      
      // Calculate operating expenses from detailed inputs if available
      const taxesAnnual = proFormaInputs?.taxesAnnual || 0;
      const insuranceAnnual = proFormaInputs?.insuranceAnnual || 0;
      const maintenancePct = proFormaInputs?.maintenancePct || 5;
      const capexPct = proFormaInputs?.capexPct || 5;
      const hasPropertyMgmt = proFormaInputs?.propertyManagement || false;
      const propertyManagementPct = proFormaInputs?.propertyManagementPct || 10;
      const landlordPaysUtilities = proFormaInputs?.utilities || false;
      const utilitiesMonthly = proFormaInputs?.utilitiesMonthly || 150;
      
      const monthlyTaxes = taxesAnnual / 12;
      const monthlyInsurance = insuranceAnnual / 12;
      const monthlyMaintenance = monthlyGrossRent * (maintenancePct / 100);
      const monthlyCapex = monthlyGrossRent * (capexPct / 100);
      const monthlyMgmt = hasPropertyMgmt ? monthlyGrossRent * (propertyManagementPct / 100) : 0;
      const monthlyUtilitiesCost = landlordPaysUtilities ? utilitiesMonthly : 0;
      
      monthlyOperatingExpenses = monthlyTaxes + monthlyInsurance + monthlyMaintenance + 
        monthlyCapex + monthlyMgmt + monthlyUtilitiesCost;
    } else if (storedWeeklyIncome !== 0) {
      // LEGACY FALLBACK: No rent data available, reconstruct from storedWeeklyIncome
      // Use cashFlowMonthly to back-calculate expenses
      monthlyDebtService = proFormaOutputs?.debtServiceMonthly || 0;
      const playerCashFlowMonthly = proFormaOutputs?.cashFlowMonthly || (storedWeeklyIncome * 4.33);
      
      // We can't know gross rent, so estimate based on cashFlowMonthly + debt service
      // This is imprecise but maintains the correct net payout
      monthlyGrossRent = Math.max(0, playerCashFlowMonthly + monthlyDebtService) * 1.15; // Estimate ~15% for expenses/vacancy
      monthlyVacancyLoss = monthlyGrossRent * 0.05; // Assume 5% vacancy
      monthlyOperatingExpenses = Math.max(0, monthlyGrossRent - monthlyVacancyLoss - monthlyDebtService - playerCashFlowMonthly);
    }
  }
  
  // Get reality adjustment from stored reality check data if not already set
  if (realityAdjustmentMonthly === 0) {
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
  
  // Credit: Net rent income (gross rent minus vacancy already factored in)
  // Show as single "Rent" entry - vacancy is baked into the amount, not shown as confusing weekly deduction
  const netRentAfterVacancy = scaledGrossRent - scaledVacancyLoss;
  if (netRentAfterVacancy > 0) {
    ledgerEntries.push({
      direction: 'credit',
      category: 'income',
      amount: netRentAfterVacancy,
      description: `🏠 Rent - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
      gameWeek: gameRun.currentWeek,
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
      gameWeek: gameRun.currentWeek,
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
      gameWeek: gameRun.currentWeek,
    });
  }
  
  // Reality check adjustment - market rent was different from player's estimate
  // Only show this if there was no grossRent (meaning player didn't enter rent properly)
  // Otherwise, the rent line already reflects the market reality
  if (weeklyRealityAdjustment !== 0 && scaledGrossRent === 0) {
    if (weeklyRealityAdjustment > 0) {
      // Player was conservative - actual market rent is higher
      ledgerEntries.push({
        direction: 'credit',
        category: 'income',
        amount: weeklyRealityAdjustment,
        description: `🏠 Weekly rent - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
        gameWeek: gameRun.currentWeek,
      });
    } else {
      // Player was optimistic - actual market rent is lower
      ledgerEntries.push({
        direction: 'debit',
        category: 'expense',
        amount: Math.abs(weeklyRealityAdjustment),
        description: `📉 Rent lower than estimated - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
        gameWeek: gameRun.currentWeek,
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
        gameWeek: gameRun.currentWeek,
      });
    } else {
      ledgerEntries.push({
        direction: 'debit',
        category: 'expense',
        amount: Math.abs(cashImpact),
        description: `${curveball?.emoji || '🎲'} ${curveball?.name || 'Curveball'} - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
        gameWeek: gameRun.currentWeek,
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

  // Calculate and track principal reduction (accelerated for game time)
  // The debt service payment is already deducted from cash above (uses realistic amounts)
  // We track accelerated principal paydown to make equity building visible during gameplay
  let principalPaid = 0;
  let interestPaid = 0;
  
  // Use fallback values from proFormaOutputs if dedicated loan fields are not set
  const originalLoanAmount = deal.originalLoanAmount ?? proFormaOutputs?.loanAmount ?? 0;
  const loanInterestRate = deal.loanInterestRate ?? proFormaInputs?.interestRate ?? 6.5;
  const loanTermMonths = deal.loanTermMonths ?? 360;
  let newLoanBalance = deal.currentLoanBalance ?? originalLoanAmount;
  
  // Track if we need to initialize loan fields (for deals created before loan tracking was added)
  const needsLoanInit = !deal.originalLoanAmount && originalLoanAmount > 0;
  
  if (newLoanBalance > 0 && originalLoanAmount > 0) {
    const { weeklyPrincipal, weeklyInterest, acceleratedPrincipal } = calculateWeeklyPrincipalPayment(
      newLoanBalance,
      loanInterestRate,
      loanTermMonths,
      originalLoanAmount
    );
    
    // Track realistic values for display purposes
    interestPaid = weeklyInterest;
    
    // Use accelerated principal for loan balance tracking (bookkeeping only)
    // This simulates 5 years of payments in 52 weeks for educational value
    principalPaid = acceleratedPrincipal;
    newLoanBalance = Math.max(0, newLoanBalance - acceleratedPrincipal);
  }
  
  // Update deal's payment tracking and loan balance
  // Also initialize loan fields if they were missing (for legacy deals)
  const updateData: Record<string, any> = {
    lastIncomePaymentWeek: gameRun.currentWeek,
    currentLoanBalance: newLoanBalance,
    totalPrincipalPaid: (deal.totalPrincipalPaid || 0) + principalPaid,
    totalInterestPaid: (deal.totalInterestPaid || 0) + interestPaid,
  };
  
  // Initialize loan fields for legacy deals
  if (needsLoanInit) {
    updateData.originalLoanAmount = originalLoanAmount;
    updateData.loanInterestRate = loanInterestRate;
    updateData.loanTermMonths = loanTermMonths;
  }
  
  await storage.updateDeal(deal.id, updateData);

  return {
    weeklyIncome: netWeeklyIncome,
    grossRent: scaledGrossRent, // After rent multiplier applied
    totalExpenses: totalWeeklyExpenses,
    vacancyLoss: scaledVacancyLoss, // After rent multiplier applied
    vacancyRate: proFormaOutputs?.effectiveVacancyRate || 0,
    curveball: curveball ? {
      id: curveball.id,
      name: curveball.name,
      description: curveball.description,
      cashImpact: curveball.cashImpact || 0,
      emoji: curveball.emoji,
    } : undefined,
    newCash,
    dealId: deal.id,
    // Loan tracking data
    principalPaid,
    interestPaid,
    remainingBalance: newLoanBalance,
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
        // Get property info for context-aware curveballs
        const property = await storage.getProperty(deal.propertyId);
        
        // Build property context for curveball system with normalized values
        const propertyContext: PropertyContext | undefined = property ? {
          propertyType: normalizePropertyType(property.propertyType || 'house'),
          conditionTag: normalizeConditionTag(property.conditionTag || 'good'),
          locationType: normalizeLocationType(property.locationType || 'suburban'),
          price: deal.purchasePrice || property.price,
        } : undefined;
        
        // Get last curveball for this deal to avoid unrealistic repetition
        const lastCurveballId = await storage.getLastCurveballForDeal(deal.id);
        const excludeIds = lastCurveballId ? [lastCurveballId] : [];
        
        // Roll for curveball events with property context (excluding recently-used)
        const curveball = rollForCurveball('rental_monthly', propertyContext, excludeIds);

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
        // Flip rehab is complete! Property is ready to list for sale
        // Player must manually trigger the sale from TimeProgressionPanel
        await storage.updateDeal(deal.id, {
          status: 'ready_to_list',
          weeksUntilCompletion: 0,
        });
        
        // Add to completedFlips with a marker that it's ready to list (not sold yet)
        completedFlips.push({
          dealId: deal.id,
          salePrice: 0,
          profit: 0,
          readyToList: true, // New flag indicating ready to sell
        } as any);
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
  titleIssue?: {
    name: string;
    cost: number;
  };
  newCash: number;
  realityCheck?: RealityCheckResult;
}

export async function activateRentalProperty(
  deal: Deal,
  gameRun: GameRun
): Promise<RentalActivationResult> {
  // Get property to access ground truth rent data
  const property = await storage.getProperty(deal.propertyId);
  if (!property) {
    throw new Error('Property not found');
  }

  const proFormaInputs = deal.proFormaInputs as any;
  const investigations = await storage.getPropertyInvestigations(gameRun.id);
  const completedDiligence = investigations
    .filter(inv => inv.propertyId === deal.propertyId)
    .map(inv => inv.investigationType);

  // Calculate ACTUAL rent from property ground truth (not player's assumption!)
  const didMarketStudy = completedDiligence.includes('market_study');
  let actualRent: number;

  if (didMarketStudy) {
    // WITH market study: Actual rent within known range with minimal market variance
    const rentRange = property.rentMax - property.rentMin;
    const baseRent = property.rentMin + (Math.random() * rentRange);
    // Small variance ±5% for market conditions
    const marketVariance = 0.95 + (Math.random() * 0.10);
    actualRent = Math.round(baseRent * marketVariance);
  } else {
    // WITHOUT market study: Higher uncertainty - player is gambling!
    // Reality could be quite different from their assumption
    const rentMid = (property.rentMin + property.rentMax) / 2;
    // Reality factor: 70% to 130% of midpoint (±30% chaos)
    const realityFactor = 0.70 + (Math.random() * 0.60);
    actualRent = Math.round(rentMid * realityFactor);
  }

  // Calculate ACTUAL cash flow using actual rent + player's expense assumptions
  // (We test their rent assumption but honor their other choices)
  const vacancyRate = proFormaInputs.vacancyRate || 8;
  const tenantPaysUtilitiesVacancyPenalty = proFormaInputs.utilities ? 0 : 1.92;
  const effectiveVacancyRate = vacancyRate + tenantPaysUtilitiesVacancyPenalty;
  const effectiveRent = actualRent * (1 - effectiveVacancyRate / 100);

  // Operating expenses (use player's assumptions)
  const monthlyTaxes = (proFormaInputs.taxesAnnual || 0) / 12;
  const monthlyInsurance = (proFormaInputs.insuranceAnnual || 0) / 12;
  const maintenanceCost = actualRent * ((proFormaInputs.maintenancePct || 8) / 100);
  const capExCost = actualRent * ((proFormaInputs.capExPct || 10) / 100);
  const utilitiesCost = proFormaInputs.utilities ? (proFormaInputs.utilitiesMonthly || 150) : 0;
  const mgmtCost = proFormaInputs.propertyManagement ? actualRent * ((proFormaInputs.propertyManagementPct || 10) / 100) : 0;

  const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
  const noiMonthly = effectiveRent - monthlyOpEx;

  // Debt service (use player's financing assumptions)
  const downPaymentPct = proFormaInputs.downPaymentPct || 25;
  const loanAmount = property.price * (1 - downPaymentPct / 100);
  const interestRate = proFormaInputs.interestRate || 6.5;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = 30 * 12;
  const debtServiceMonthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  const actualCashFlowMonthly = noiMonthly - debtServiceMonthly;
  const weeklyIncome = calculateWeeklyIncome(actualCashFlowMonthly);

  // Check for undiscovered property issues (surprise repair costs!)
  const propertyName = property?.name || '';
  const undiscoveredIssues = getUndiscoveredIssues(propertyName, completedDiligence);
  let surpriseCosts = undiscoveredIssues.length > 0 ? calculateSurpriseCosts(undiscoveredIssues) : 0;
  
  // Check for title issues (20% chance if title search was skipped)
  const didTitleSearch = completedDiligence.includes('title_search');
  const titleIssue = checkForTitleIssue(didTitleSearch);
  let titleIssueName: string | undefined;
  if (titleIssue.hasIssue) {
    surpriseCosts += titleIssue.cost;
    titleIssueName = titleIssue.issueName;
  }
  
  // Create ledger entry for surprise repair costs or title issues if any
  let newCash = gameRun.cash;
  if (surpriseCosts > 0) {
    const repairIssueNames = undiscoveredIssues.map(i => i.name);
    const allIssueNames = titleIssueName 
      ? [...repairIssueNames, `Title issue: ${titleIssueName}`]
      : repairIssueNames;
    const issueDescription = allIssueNames.join(', ');
    
    const ledgerEntry: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'> = {
      direction: 'debit',
      category: 'expense',
      amount: surpriseCosts,
      description: titleIssueName && repairIssueNames.length === 0
        ? `📜 Title issue discovered: ${titleIssueName}`
        : `⚠️ Issues discovered: ${issueDescription}`,
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
  
  // Calculate reality check - compare player assumptions to market reality
  const playerProjectedCashFlow = (proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0) * (1 - (proFormaInputs?.vacancyRate || 5) / 100) - monthlyOpEx - debtServiceMonthly;
  const realityCheck = calculateRealityCheck(
    { rentMin: property.rentMin, rentMax: property.rentMax, locationType: property.locationType },
    { monthlyRent: proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0, vacancyRate: proFormaInputs?.vacancyRate || 5 },
    playerProjectedCashFlow,
    completedDiligence
  );

  // === STORED VALUES FOR WEEKLY PROCESSING ===
  // Use stored versions to avoid redeclaring - these are for the updatedProFormaOutputs
  const storedMarketVacancyRate = property?.locationType === 'urban' ? 7 : 5;
  const storedEffectiveVacancyRate = effectiveVacancyRate;
  const storedUtilityVacancyPenalty = tenantPaysUtilitiesVacancyPenalty;
  
  // Calculate monthly vacancy loss for this specific property
  const monthlyVacancyLoss = monthlyGrossRent * (storedEffectiveVacancyRate / 100);
  
  // Operating expenses - use values from proFormaOutputs if available
  const storedDebtService = proFormaOutputs?.debtServiceMonthly || debtServiceMonthly;
  const monthlyMaintenance = monthlyGrossRent * ((proFormaInputs?.maintenancePct || 5) / 100);
  const monthlyCapex = monthlyGrossRent * ((proFormaInputs?.capexPct || 5) / 100);
  const hasPropertyMgmt = proFormaInputs?.propertyManagement || false;
  const monthlyMgmt = hasPropertyMgmt ? monthlyGrossRent * (proFormaInputs?.propertyManagementPct || 10) / 100 : 0;
  const monthlyUtilitiesCost = proFormaInputs?.utilities ? (proFormaInputs?.utilitiesMonthly || 150) : 0;
  
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
    utilityVacancyPenalty: storedUtilityVacancyPenalty,
    marketVacancyRate: storedMarketVacancyRate,
    effectiveVacancyRate: storedEffectiveVacancyRate,
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

  // Get loan details from pro forma for tracking
  const initialLoanBalance = proFormaOutputs?.loanAmount || 0;
  const loanInterestRate = proFormaInputs?.interestRate || 6.5;
  const loanTermMonths = 360; // 30-year mortgage standard
  
  const updatedDeal = await storage.updateDeal(deal.id, {
    status: 'active_rental',
    weeklyIncome,
    lastIncomePaymentWeek: gameRun.currentWeek,
    proFormaOutputs: updatedProFormaOutputs,
    purchasePrice: property?.price || 0,
    purchaseWeek: gameRun.currentWeek, // For seasoning period tracking
    // Loan tracking fields
    originalLoanAmount: initialLoanBalance,
    loanInterestRate,
    loanTermMonths,
    currentLoanBalance: initialLoanBalance,
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    refinanceCount: 0, // Initialize refinance count
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

  // Collect all surprise issues for reporting
  const allSurpriseIssues = undiscoveredIssues.map(i => i.name);
  if (titleIssueName) {
    allSurpriseIssues.push(`Title: ${titleIssueName}`);
  }

  return {
    deal: updatedDeal!,
    surpriseCosts,
    surpriseIssues: allSurpriseIssues,
    titleIssue: titleIssue.hasIssue ? { name: titleIssueName!, cost: titleIssue.cost } : undefined,
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
