/**
 * Game Mechanics Module
 *
 * Handles core game systems:
 * - Flip deal completion and proceeds distribution
 * - Rental income payouts (weekly)
 * - Time progression
 * - Curveball event triggering
 */

import { storage, IStorage } from './storage';
import type { GameRun, Deal, InsertLedgerEntry, InsertCurveballEvent, MarketCondition } from '@shared/schema';
import { MARKET_CONDITIONS } from '@shared/schema';
import * as schema from '@shared/schema';
import { db } from './storage';
import { eq } from 'drizzle-orm';
import { rollForCurveball, rollForCurveballWithIssues, type PropertyContext, type CurveballResult, normalizeConditionTag, normalizePropertyType, normalizeLocationType } from '../client/src/lib/curveballs';
import { calculateSurpriseCosts, PropertyIssue, getRandomizedPropertyIssues } from '@shared/propertyIssues';

/**
 * Market Conditions System
 * 
 * 5 levels: terrible, poor, neutral, good, excellent
 * Changes every 4 weeks (monthly) with gradual shifts (no extreme jumps)
 * 65% of the time should be "good" or "excellent"
 * 
 * Affects flip sale prices:
 * - Terrible: -15% to -5% (no upside)
 * - Poor: -10% to +2%
 * - Neutral: -5% to +5%
 * - Good: -3% to +10%
 * - Excellent: 0% to +15%
 */

export interface MarketMultipliers {
  min: number;
  max: number;
}

export function getMarketMultipliers(condition: MarketCondition): MarketMultipliers {
  switch (condition) {
    case 'terrible':
      return { min: 0.85, max: 0.95 };
    case 'poor':
      return { min: 0.90, max: 1.02 };
    case 'neutral':
      return { min: 0.95, max: 1.05 };
    case 'good':
      return { min: 0.97, max: 1.10 };
    case 'excellent':
      return { min: 1.00, max: 1.15 };
    default:
      return { min: 0.95, max: 1.05 };
  }
}

/**
 * Randomize starting market condition (BAL-003 fix)
 * Weighted distribution: not always "good" - any state is possible
 * Weights: terrible 10%, poor 15%, neutral 25%, good 30%, excellent 20%
 */
export function getRandomStartingMarket(): MarketCondition {
  const rand = Math.random();
  if (rand < 0.10) return 'terrible';
  if (rand < 0.25) return 'poor';
  if (rand < 0.50) return 'neutral';
  if (rand < 0.80) return 'good';
  return 'excellent';
}

/**
 * Progress market condition with rebalanced weights (BAL-003 fix)
 * Poor/Terrible probability weights increased by 25% vs original
 * 
 * Adjusted transition probabilities:
 * From terrible (0): 70% up, 30% stay (slower recovery, +25% stay weight)
 * From poor (1): 55% up, 20% stay, 25% down (stronger downward pull)
 * From neutral (2): 50% up, 20% stay, 30% down (more likely to dip)
 * From good (3): 25% up, 30% stay, 35% down to neutral, 10% CRASH to poor
 * From excellent (4): 40% stay, 45% down to good, 15% CRASH to neutral or worse
 */
export function progressMarketCondition(currentCondition: MarketCondition): MarketCondition {
  const currentIndex = MARKET_CONDITIONS.indexOf(currentCondition);
  const rand = Math.random();
  
  let newIndex: number;
  
  switch (currentIndex) {
    case 0: // terrible - slower recovery than before
      newIndex = rand < 0.70 ? 1 : 0;
      break;
    case 1: // poor - weaker upward pull, stronger downward
      if (rand < 0.55) newIndex = 2;
      else if (rand < 0.75) newIndex = 1;
      else newIndex = 0;
      break;
    case 2: // neutral - more balanced, easier to slip
      if (rand < 0.50) newIndex = 3;
      else if (rand < 0.70) newIndex = 2;
      else newIndex = 1;
      break;
    case 3: // good - harder to stay, increased crash chance
      if (rand < 0.25) newIndex = 4;
      else if (rand < 0.55) newIndex = 3;
      else if (rand < 0.90) newIndex = 2;
      else newIndex = 1; // 10% crash to poor
      break;
    case 4: // excellent - more volatile, stronger downward pressure
      if (rand < 0.40) newIndex = 4;
      else if (rand < 0.85) newIndex = 3;
      else if (rand < 0.95) newIndex = 2;
      else newIndex = 1; // 5% crash all the way to poor
      break;
    default:
      newIndex = 2; // Default to neutral (not good)
  }
  
  return MARKET_CONDITIONS[newIndex];
}

/**
 * Check if market should change (every 4 weeks = monthly)
 * BAL-003: Force first transition by Month 4 (week 16) if none has occurred
 */
export function shouldMarketChange(currentWeek: number, lastMarketChangeWeek: number): boolean {
  // Normal monthly check
  if (currentWeek - lastMarketChangeWeek >= 4) return true;
  // Force first transition by week 16 if market has never changed (lastMarketChangeWeek is 0)
  if (lastMarketChangeWeek === 0 && currentWeek >= 16) return true;
  return false;
}

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

import { rollForEnhancedMaintenance, updateRecentCurveballIds } from './maintenanceMechanics';

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
    tenantMessage?: string | null;  // Text message from tenant about this issue
    fromIssue?: boolean;            // Whether repair was caused by undiscovered property issue
    issueId?: string;               // The undiscovered issue that caused this
  };
  newCash: number;
  dealId: number;
  // Loan tracking
  principalPaid?: number;
  interestPaid?: number;
  remainingBalance?: number;
}

interface CompletedRentalRehab {
  dealId: number;
  propertyName: string;
  newMonthlyRent: number;
  previousRent: number;
  fixedCount: number;
  totalIssueCount: number;
  repairCompletionFactor: number;
}

interface WeekProgressionResult {
  rentalPayments: RentalIncomeResult[];
  completedFlips: FlipSaleResult[];
  completedRentalRehabs: CompletedRentalRehab[];
  curveballs: any[];
  newWeek: number;
  weeksRemaining: number;
  marketCondition: MarketCondition;
  marketChanged: boolean;
}

/**
 * Complete a flip deal and return proceeds to player's balance
 * Sale price is calculated based on:
 * 1. Whether player did comp analysis (appraisal) - reduces uncertainty
 * 2. Rehab investment relative to property requirements
 * 3. Current market conditions (affects price range)
 * 
 * WITH comps: Sale price is within actual market range (arvMin-arvMax)
 * WITHOUT comps: Sale price can deviate significantly from player's estimate!
 */
export async function completeFlipDeal(
  deal: Deal,
  gameRun: GameRun,
  curveball?: any,
  marketCondition?: MarketCondition
): Promise<FlipSaleResult> {
  const proFormaOutputs = deal.proFormaOutputs as any;
  const proFormaInputs = deal.proFormaInputs as any;

  // Get property to access ARV and rehab ranges
  const property = await storage.getProperty(deal.propertyId);
  
  // Get market multipliers for current conditions
  const market = marketCondition || (gameRun.marketCondition as MarketCondition) || 'good';
  const marketMult = getMarketMultipliers(market);
  
  // Check if player did due diligence (appraisal = comp analysis)
  const investigations = await storage.getPropertyInvestigations(gameRun.id);
  const completedDiligence = investigations
    .filter(inv => inv.propertyId === deal.propertyId)
    .map(inv => inv.investigationType);
  const didComps = completedDiligence.includes('appraisal');
  
  // Check for undiscovered property issues (surprise repair costs!)
  // Use randomized issues (matching what the client shows) based on game run + property
  const allIssues = property 
    ? getRandomizedPropertyIssues(gameRun.id, deal.propertyId, property.propertyType, property.conditionTag, property.waterSource || 'public')
    : [];
  const undiscoveredIssues = allIssues.filter(issue =>
    !issue.discoveredBy.some(method => completedDiligence.includes(method))
  );
  let surpriseCosts = undiscoveredIssues.length > 0 ? calculateSurpriseCosts(undiscoveredIssues) : 0;
  
  // Check for title issues (20% chance if title search was skipped)
  const didTitleSearch = completedDiligence.includes('title_search');
  const titleIssue = checkForTitleIssue(didTitleSearch);
  let titleIssueName: string | undefined;
  if (titleIssue.hasIssue) {
    surpriseCosts += titleIssue.cost;
    titleIssueName = titleIssue.issueName;
  }
  
  // Calculate sale price based on due diligence, rehab investment, AND market conditions
  // REALISTIC FLIP PRICING:
  // - No rehab = you sell at roughly what you paid (distressed value)
  // - Full rehab = you can achieve ARV (after-repair value)
  // - Unfixed issues reduce sale price (buyers will see the problems)
  let salePrice: number;
  if (property && property.arvMin && property.arvMax && property.rehabMin && property.rehabMax) {
    // Get player's actual rehab spend (budget + contingency)
    // Apply finish level multiplier - luxury finishes cost more but boost ARV
    const finishLevel = proFormaInputs?.finishLevel || 'builder';
    const finishCostMult = finishLevel === 'luxury' ? 1.4 : 1.0;
    const finishArvBoost = finishLevel === 'luxury' ? 0.08 : 0;
    const rawRehabBudget = proFormaInputs?.rehabBudget || 0;
    const rehabBudget = Math.round(rawRehabBudget * finishCostMult);
    const contingencyPct = proFormaInputs?.contingencyPct || 10;
    const actualRehabSpend = rehabBudget * (1 + contingencyPct / 100);
    
    // The "as-is" value is what you paid - the purchase price
    // ARV is only achievable with FULL renovation
    const purchasePrice = deal.purchasePrice || proFormaInputs?.purchasePrice || property.arvMin * 0.7;
    const maxArv = property.arvMax;
    
    // Calculate rehab completion factor (0 to 1)
    // Based on how much of the FULL rehab was done
    const fullRehabCost = property.rehabMax;
    const completionFactor = fullRehabCost > 0 
      ? Math.max(0, Math.min(1, actualRehabSpend / fullRehabCost))
      : 0;
    
    // Calculate CONDITION PENALTY from unfixed issues
    // Each undiscovered issue that wasn't fixed reduces sale price
    // Buyers WILL find these issues during their inspection!
    const issueCount = undiscoveredIssues.length;
    const conditionPenalty = issueCount * 0.03; // Each unfixed issue = 3% price reduction
    const conditionMultiplier = Math.max(0.70, 1 - conditionPenalty); // Cap at 30% reduction
    
    if (didComps) {
      // WITH COMPS: Sale price scales predictably from purchase price to ARV
      // 0% rehab = ~purchase price (maybe tiny premium for marketing)
      // 100% rehab = near ARV (full value)
      
      // Base price scales linearly from purchase price to ARV based on rehab
      const priceSpread = maxArv - purchasePrice;
      let baseSalePrice = purchasePrice + (completionFactor * priceSpread * 0.9); // 90% of spread achievable
      
      // Apply condition penalty for unfixed issues
      baseSalePrice = baseSalePrice * conditionMultiplier;
      
      // Apply MARKET-BASED variance
      const marketVariance = marketMult.min + (Math.random() * (marketMult.max - marketMult.min));
      salePrice = Math.round(baseSalePrice * marketVariance);
      
      // If no rehab was done, cap sale price near purchase price (can't profit without work)
      if (rehabBudget === 0) {
        const noRehabMax = purchasePrice * 1.05 * marketVariance; // Max 5% above purchase + market
        salePrice = Math.min(salePrice, Math.round(noRehabMax));
      }
    } else {
      // WITHOUT COMPS: Player is flying blind! Market reality may differ wildly
      const playerEstimate = proFormaInputs?.arv || ((property.arvMin + property.arvMax) / 2);
      
      // Generate a "reality check" - actual market price varies widely
      const baseRealityMin = 0.70 * marketMult.min;
      const baseRealityMax = 1.20 * marketMult.max; // Reduced upside without research
      const realityFactor = baseRealityMin + (Math.random() * (baseRealityMax - baseRealityMin));
      
      // Calculate what the property is actually worth based on work done
      const priceSpread = maxArv - purchasePrice;
      let actualValue = purchasePrice + (completionFactor * priceSpread * 0.85);
      actualValue = actualValue * conditionMultiplier;
      
      // Blend player estimate (with uncertainty) and actual value
      const uncertainPrice = playerEstimate * realityFactor;
      salePrice = Math.round((uncertainPrice * 0.4) + (actualValue * 0.6));
      
      // If no rehab was done, sale price is very limited
      if (rehabBudget === 0) {
        const noRehabMax = purchasePrice * 1.02 * realityFactor; // Only 2% above purchase
        salePrice = Math.min(salePrice, Math.round(noRehabMax));
      }
    }
    
    // Absolute floor: can't sell for less than 60% of purchase price
    salePrice = Math.max(salePrice, Math.round(purchasePrice * 0.6));
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

  // Holding costs (interest, taxes, insurance) are already charged weekly during rehab
  // via chargeFlipCarryingCosts() in advanceGameWeek() - no lump-sum needed here

  // Calculate selling costs (realtor commission, closing costs, etc.)
  const sellingCostsPct = proFormaInputs?.sellingCostsPct || 8; // Default 8% if not specified
  const sellingCosts = Math.round(salePrice * (sellingCostsPct / 100));

  // Calculate total holding costs already paid (for profit calculation only)
  // These were already deducted from cash weekly, so we just need the total for ROI display
  const loanAmount = proFormaOutputs?.loanAmount || 0;
  const interestRate = proFormaInputs?.interestRate || deal.loanInterestRate || 0;
  const taxesAnnual = proFormaInputs?.taxesAnnual || 0;
  const insuranceAnnual = proFormaInputs?.insuranceAnnual || 0;
  const rehabWeeks = deal.weeksUntilCompletion || proFormaInputs?.rehabWeeks || 0;
  const holdingCostPerWeek = Math.round(
    (loanAmount * (interestRate / 100) / 52) +
    (taxesAnnual / 52) +
    (insuranceAnnual / 52)
  );
  const totalHoldingCostsPaid = holdingCostPerWeek * rehabWeeks;

  const allInCost = proFormaOutputs.allInBasis || 0;
  const profit = salePrice - allInCost - totalHoldingCostsPaid - sellingCosts - surpriseCosts;

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
  curveball?: any,
  currentCash?: number
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
  
  // Use monthly values directly for ledger display (each game turn = 1 month)
  const weeklyGrossRent = Math.max(0, Math.round(monthlyGrossRent));
  const weeklyVacancyLoss = Math.max(0, Math.round(monthlyVacancyLoss));
  const weeklyOperatingExpenses = Math.max(0, Math.round(monthlyOperatingExpenses));
  const weeklyDebtService = Math.max(0, Math.round(monthlyDebtService));
  
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
  
  // NOTE: monthlyGrossRent already contains the ACTUAL market rent (set at activation)
  // It is NOT the player's assumption - it's the true rent based on property condition, rehab, and market factors
  // Therefore we do NOT need a separate reality adjustment - the rent IS already the reality!
  
  // Calculate actual net weekly income from components
  // This is the TRUE cash impact: rent - vacancy - opex - debt + curveball cash
  // For legacy rentals, use storedWeeklyIncome if component breakdown is incomplete
  const componentBasedNet = scaledGrossRent - scaledVacancyLoss - fixedOperatingExpenses - fixedDebtService + cashImpact;
  
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
    
    // Handle lease break - replace the tenant with a new one
    if (curveball.id === 'early_lease_break') {
      // Delete the old tenant
      const oldTenant = await storage.getTenantByDeal(deal.id);
      if (oldTenant) {
        await db.delete(schema.tenants).where(eq(schema.tenants.id, oldTenant.id));
      }
      // New tenant will be auto-created on next rental payment when client detects missing tenant
    }
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
  
  // Credit: Net rent income (gross rent minus vacancy)
  // The monthlyGrossRent already contains the ACTUAL market rent (not player's estimate)
  // so we just need to apply vacancy - no separate reality adjustment needed
  const netRentAfterVacancy = scaledGrossRent - scaledVacancyLoss;
  const actualRentReceived = netRentAfterVacancy;
  if (actualRentReceived > 0) {
    ledgerEntries.push({
      direction: 'credit',
      category: 'income',
      amount: actualRentReceived,
      description: `Rent - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
      gameWeek: gameRun.currentWeek,
    });
  } else if (actualRentReceived < 0) {
    // Edge case: reality adjustment is negative and exceeds rent
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: Math.abs(actualRentReceived),
      description: `Rent shortfall - ${propertyName}`,
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
      description: `Operating costs - ${propertyName}`,
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
      description: `Mortgage - ${propertyName}`,
      propertyId: deal.propertyId,
      dealId: deal.id,
      gameWeek: gameRun.currentWeek,
    });
  }
  
  // Reality check adjustment is now baked into the rent line above
  // No separate line needed - the rent line already shows actual market rent
  // This is cleaner and less confusing for players
  
  // Curveball cash impact (if any)
  if (cashImpact !== 0) {
    if (cashImpact > 0) {
      ledgerEntries.push({
        direction: 'credit',
        category: 'income',
        amount: cashImpact,
        description: `${curveball?.name || 'Curveball'} - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
        gameWeek: gameRun.currentWeek,
      });
    } else {
      ledgerEntries.push({
        direction: 'debit',
        category: 'expense',
        amount: Math.abs(cashImpact),
        description: `${curveball?.name || 'Curveball'} - ${propertyName}`,
        propertyId: deal.propertyId,
        dealId: deal.id,
        gameWeek: gameRun.currentWeek,
      });
    }
  }
  

  // Use passed-in running cash to avoid stale reads (BUG-007 fix)
  const cashForLedger = currentCash ?? gameRun.cash;

  const { newCash } = await storage.createLedgerEntriesOnly(
    gameRun.id,
    ledgerEntries,
    cashForLedger
  );

  // Calculate and track principal reduction (accelerated for game time)
  // The debt service payment is already deducted from cash above (uses realistic amounts)
  // We track accelerated principal paydown to make equity building visible during gameplay
  let principalPaid = 0;
  let interestPaid = 0;
  
  // Use fallback values from proFormaOutputs if dedicated loan fields are not set
  const originalLoanAmount = deal.originalLoanAmount ?? proFormaOutputs?.loanAmount ?? 0;
  const loanInterestRate = deal.loanInterestRate ?? proFormaOutputs?.interestRate ?? 6.5;
  const loanTermMonths = deal.loanTermMonths ?? proFormaOutputs?.loanTermMonths ?? 360;
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
      tenantMessage: curveball.tenantMessage,
      fromIssue: curveball.fromIssue,
      issueId: curveball.issueId,
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
 * Charge weekly carrying costs for flip properties (in_rehab or ready_to_list)
 * Similar to rental expenses: mortgage interest, taxes, insurance, but NO income
 */
async function chargeFlipCarryingCosts(deal: Deal, gameRun: GameRun, storage: IStorage, currentCash: number): Promise<number> {
  const proFormaOutputs = deal.proFormaOutputs as any;
  const proFormaInputs = deal.proFormaInputs as any;
  const property = await storage.getProperty(deal.propertyId);
  const propertyName = property?.name || `Property #${deal.propertyId}`;
  
  const loanAmount = proFormaOutputs?.loanAmount || deal.originalLoanAmount || 0;
  const interestRate = deal.loanInterestRate ?? proFormaOutputs?.interestRate ?? 7.0;
  const purchasePrice = property?.price || proFormaInputs?.purchasePrice || 200000;
  
  const weeklyInterest = Math.round((loanAmount * (interestRate / 100)) / 52);
  
  const annualTaxes = purchasePrice * 0.015;
  const annualInsurance = purchasePrice * 0.005;
  const weeklyTaxesAndInsurance = Math.round((annualTaxes + annualInsurance) / 52);
  
  const weeklyCarryingCost = weeklyInterest + weeklyTaxesAndInsurance;
  
  if (weeklyCarryingCost <= 0) return currentCash;
  
  const newCash = currentCash - weeklyCarryingCost;
  
  // Create ledger entry only (no cash update - handled by advanceGameWeek)
  await storage.createLedgerEntry({
    gameRunId: gameRun.id,
    direction: 'debit',
    category: 'expense',
    amount: weeklyCarryingCost,
    balanceAfter: newCash,
    description: `Carrying costs - ${propertyName} (interest, taxes, insurance)`,
    propertyId: deal.propertyId,
    dealId: deal.id,
    gameWeek: gameRun.currentWeek,
  });
  
  return newCash;
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
  const completedRentalRehabs: CompletedRentalRehab[] = [];
  const curveballs: any[] = [];

  // BUG-007 fix: Track running cash in memory, apply single atomic update at end
  let runningCash = gameRun.cash;

  // Get all property investigations for this game to check undiscovered issues
  const investigations = await storage.getPropertyInvestigations(gameRunId);

  // Process active rental deals - pay weekly income
  // Skip rentals under rehab - no income when tenant is displaced
  for (const deal of deals) {
    if (deal.status === 'active_rental' && !deal.rentalRehabActive) {
      if ((deal.lastIncomePaymentWeek || 0) < gameRun.currentWeek + 1) {
        const property = await storage.getProperty(deal.propertyId);

        const recentCurveballIds = (deal.recentCurveballIds as string[] | null) || [];

        const curveball = property
          ? rollForEnhancedMaintenance(property, deal, recentCurveballIds)
          : rollForCurveball('rental_monthly', undefined, recentCurveballIds);

        const result = await processRentalIncome(deal, gameRun, curveball, runningCash);
        runningCash = result.newCash;
        rentalPayments.push(result);

        if (curveball) {
          curveballs.push(curveball);
          
          const updatedRecentIds = updateRecentCurveballIds(recentCurveballIds, curveball.id);
          await storage.updateDeal(deal.id, { recentCurveballIds: updatedRecentIds });
        }
      }
    }
  }

  // Process flips in rehab - count down weeks AND charge carrying costs
  for (const deal of deals) {
    if (deal.status === 'in_rehab' && deal.weeksUntilCompletion) {
      const weeksLeft = deal.weeksUntilCompletion - 1;

      runningCash = await chargeFlipCarryingCosts(deal, gameRun, storage, runningCash);

      if (weeksLeft <= 0) {
        await storage.updateDeal(deal.id, {
          status: 'ready_to_list',
          weeksUntilCompletion: 0,
        });
        
        completedFlips.push({
          dealId: deal.id,
          salePrice: 0,
          profit: 0,
          readyToList: true,
        } as any);
      } else {
        await storage.updateDeal(deal.id, {
          weeksUntilCompletion: weeksLeft,
        });
      }
    }
  }

  // Process flips ready to list - charge carrying costs while waiting to sell
  for (const deal of deals) {
    if (deal.status === 'ready_to_list') {
      runningCash = await chargeFlipCarryingCosts(deal, gameRun, storage, runningCash);
    }
  }

  // Process rental rehab progress - count down weeks for properties under renovation
  // Also charge carrying costs (mortgage, taxes, insurance) since no rental income during rehab
  for (const deal of deals) {
    if (deal.status === 'active_rental' && deal.rentalRehabActive && deal.rentalRehabWeeksRemaining) {
      const weeksLeft = deal.rentalRehabWeeksRemaining - 1;
      const property = await storage.getProperty(deal.propertyId);
      
      const proFormaOutputs = deal.proFormaOutputs as any;
      const monthlyDebtService = proFormaOutputs?.monthlyDebtService || proFormaOutputs?.debtServiceMonthly || 0;
      const monthlyOpEx = proFormaOutputs?.monthlyOperatingExpenses || proFormaOutputs?.monthlyOpEx || 0;
      
      const weeklyCarryingCost = Math.round(monthlyDebtService + monthlyOpEx);
      
      if (weeklyCarryingCost > 0) {
        runningCash = runningCash - weeklyCarryingCost;
        
        await storage.createLedgerEntry({
          gameRunId,
          direction: 'debit',
          category: 'expense',
          amount: weeklyCarryingCost,
          balanceAfter: runningCash,
          description: `Carrying costs (vacant) - ${property?.name || 'Property'} (mortgage, taxes, insurance)`,
          propertyId: deal.propertyId,
          dealId: deal.id,
          gameWeek: gameRun.currentWeek + 1,
        });
      }

      if (weeksLeft <= 0) {
        // Rental rehab is complete! Property ready for new tenant
        const proFormaInputs = deal.proFormaInputs as any;
        const proFormaOutputs = deal.proFormaOutputs as any;
        
        const walkthroughData = deal.contractorWalkthroughData as ContractorWalkthroughResult | null;
        const allIssues = walkthroughData?.repairItems || [];
        const fixedIssuesThisRound = deal.rentalRehabItems as ContractorWalkthroughItem[] | null;
        const previouslyFixedIds = (deal.completedRepairIds as string[] | null) || [];
        
        const fixedThisRoundIds = (fixedIssuesThisRound || []).map(i => i.id);
        const completedSet = new Set([...previouslyFixedIds, ...fixedThisRoundIds]);
        const allCompletedIds = Array.from(completedSet);
        
        const fixedCount = allCompletedIds.length;
        const allIssuesCount = allIssues.length;
        
        let baseMonthlyRent: number;
        if (proFormaOutputs?.monthlyGrossRent) {
          baseMonthlyRent = proFormaOutputs.monthlyGrossRent;
        } else if (property) {
          baseMonthlyRent = Math.floor((property.rentMin + property.rentMax) / 2);
        } else {
          baseMonthlyRent = 1500;
        }
        
        // Rent boost from THIS round's fixed repairs only (previous rounds already applied)
        // Each repair gets its rentImpactPct PLUS a minimum floor of $25/item per $1000 rent
        const minBumpPerItem = Math.max(25, Math.round(baseMonthlyRent * 0.02));
        const totalFixedRentIncrease = (fixedIssuesThisRound || []).reduce((sum, item) => {
          const pctBump = Math.round(baseMonthlyRent * ((item.rentImpactPct || 2) / 100));
          return sum + Math.max(minBumpPerItem, pctBump);
        }, 0);
        
        // Unfixed issues only mildly depress rent (0.25% per unfixed item, much less aggressive)
        const unfixedIssues = allIssues.filter(item => !allCompletedIds.includes(item.id));
        const unfixedIssueCount = unfixedIssues.length;
        const unfixedDepressionAmt = unfixedIssues.reduce((sum, _item) => {
          return sum + Math.round(baseMonthlyRent * 0.0025);
        }, 0);
        
        // Net rent change: gains from this round's fixes minus mild depression (capped at 25% of base)
        const maxIncrease = Math.round(baseMonthlyRent * 0.25);
        const rentIncrease = Math.min(Math.max(0, totalFixedRentIncrease - unfixedDepressionAmt), maxIncrease);
        const newMonthlyRent = baseMonthlyRent + rentIncrease;
        
        const repairCompletionFactor = allIssuesCount > 0 
          ? fixedCount / allIssuesCount 
          : 1.0;
        
        const effectiveVacancyRate = proFormaOutputs?.effectiveVacancyRate || 
          (property?.locationType === 'urban' ? 7 : 5);
        const newMonthlyVacancyLoss = newMonthlyRent * (effectiveVacancyRate / 100);
        
        const taxesAnnual = proFormaInputs?.taxesAnnual || 0;
        const insuranceAnnual = proFormaInputs?.insuranceAnnual || 0;
        const maintenancePct = proFormaInputs?.maintenancePct || 5;
        const capexPct = proFormaInputs?.capexPct || 5;
        const hasPropertyMgmt = proFormaInputs?.propertyManagement || false;
        const propertyManagementPct = proFormaInputs?.propertyManagementPct || 10;
        const landlordPaysUtilities = proFormaInputs?.utilities || false;
        const utilitiesMonthly = proFormaInputs?.utilitiesMonthly || 150;
        
        const newMonthlyTaxes = taxesAnnual / 12;
        const newMonthlyInsurance = insuranceAnnual / 12;
        const newMonthlyMaintenance = newMonthlyRent * (maintenancePct / 100);
        const newMonthlyCapex = newMonthlyRent * (capexPct / 100);
        const newMonthlyMgmt = hasPropertyMgmt ? newMonthlyRent * (propertyManagementPct / 100) : 0;
        const newMonthlyUtilities = landlordPaysUtilities ? utilitiesMonthly : 0;
        const newMonthlyOperatingExpenses = newMonthlyTaxes + newMonthlyInsurance + 
          newMonthlyMaintenance + newMonthlyCapex + newMonthlyMgmt + newMonthlyUtilities;
        
        const monthlyDebtService = proFormaOutputs?.monthlyDebtService || proFormaOutputs?.debtServiceMonthly || 0;
        
        const newNetMonthlyCashFlow = newMonthlyRent - newMonthlyVacancyLoss - newMonthlyOperatingExpenses - monthlyDebtService;
        const newWeeklyIncome = calculateWeeklyIncome(newNetMonthlyCashFlow);

        await storage.updateDeal(deal.id, {
          rentalRehabActive: false,
          rentalRehabWeeksRemaining: 0,
          tenantDisplaced: false,
          weeklyIncome: Math.max(0, newWeeklyIncome),
          completedRepairIds: allCompletedIds,
          proFormaOutputs: {
            ...proFormaOutputs,
            monthlyGrossRent: newMonthlyRent,
            monthlyVacancyLoss: newMonthlyVacancyLoss,
            monthlyOperatingExpenses: newMonthlyOperatingExpenses,
            postRehabCompleted: true,
            repairCompletionFactor,
            unfixedIssueCount,
          },
        });

        // Create ledger entry for rehab completion showing actual rent increase
        const partialNote = unfixedIssueCount > 0 
          ? ` (${(fixedIssuesThisRound || []).length}/${allIssuesCount} issues fixed)`
          : '';
        const rentChangePctDisplay = baseMonthlyRent > 0 ? Math.round((rentIncrease / baseMonthlyRent) * 100) : 0;
        const rentChangeNote = rentIncrease > 0 
          ? ` Rent +$${rentIncrease.toLocaleString()}/mo (+${rentChangePctDisplay}%)`
          : rentIncrease === 0 ? ' Rent unchanged' : '';
        await storage.createLedgerEntry({
          gameRunId,
          direction: 'credit',
          category: 'income',
          amount: 0,
          balanceAfter: gameRun.cash,
          description: `Rental rehab complete - ${property?.name || 'Property'} (new rent: $${newMonthlyRent.toLocaleString()}/mo)${partialNote}${rentChangeNote}`,
          propertyId: deal.propertyId,
          dealId: deal.id,
          gameWeek: gameRun.currentWeek + 1,
        });
        
        // Add to completed rehabs for frontend notification
        completedRentalRehabs.push({
          dealId: deal.id,
          propertyName: property?.name || 'Property',
          newMonthlyRent,
          previousRent: baseMonthlyRent,
          fixedCount,
          totalIssueCount: allIssuesCount,
          repairCompletionFactor,
        });

        // Collect first rent payment at the NEW rate now that tenant is back
        // Use currentWeek + 1 so rent entry appears in the same month as rehab completion
        const updatedDeal = await storage.getDeal(deal.id);
        if (updatedDeal) {
          const gameRunForRent = { ...gameRun, currentWeek: gameRun.currentWeek + 1 };
          const result = await processRentalIncome(updatedDeal, gameRunForRent, undefined, runningCash);
          runningCash = result.newCash;
          rentalPayments.push(result);
          await storage.updateDeal(deal.id, { lastIncomePaymentWeek: gameRun.currentWeek + 1 });
        }
      } else {
        // Update weeks remaining
        await storage.updateDeal(deal.id, {
          rentalRehabWeeksRemaining: weeksLeft,
        });
      }
    }
  }

  // Advance game week
  const newWeek = gameRun.currentWeek + 1;
  const newWeeksRemaining = gameRun.weeksRemaining - 1;

  // Check if market should change (every 4 weeks = monthly)
  let currentMarket = (gameRun.marketCondition as MarketCondition) || 'good';
  const lastMarketChangeWeek = gameRun.lastMarketChangeWeek ?? 0;
  let marketChanged = false;

  if (shouldMarketChange(newWeek, lastMarketChangeWeek)) {
    const newMarket = progressMarketCondition(currentMarket);
    if (newMarket !== currentMarket) {
      currentMarket = newMarket;
      marketChanged = true;
    }
    // Single atomic cash + state update at end of week (BUG-007 fix)
    await storage.updateGameRun(gameRunId, {
      cash: runningCash,
      currentWeek: newWeek,
      weeksRemaining: newWeeksRemaining,
      marketCondition: currentMarket,
      lastMarketChangeWeek: newWeek,
    });
  } else {
    // Single atomic cash + state update at end of week (BUG-007 fix)
    await storage.updateGameRun(gameRunId, {
      cash: runningCash,
      currentWeek: newWeek,
      weeksRemaining: newWeeksRemaining,
    });
  }

  return {
    rentalPayments,
    completedFlips,
    completedRentalRehabs,
    curveballs,
    newWeek,
    weeksRemaining: newWeeksRemaining,
    marketCondition: currentMarket,
    marketChanged,
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
  // CRITICAL: Rent is tied to PROPERTY CONDITION (rehab investment), not just market study!
  // Uses SAME formula as flip sale price for consistency
  const didMarketStudy = completedDiligence.includes('market_study');
  const didContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');
  const didInspection = completedDiligence.includes('inspection');
  
  // Calculate rehab completion factor using SAME FORMULA as flip logic
  // This ensures consistent incentives between rent and flip strategies
  const rehabBudget = proFormaInputs?.rehabBudget || 0;
  const contingencyPct = proFormaInputs?.contingencyPct || 0;
  const actualRehabSpend = rehabBudget * (1 + contingencyPct / 100);
  const rehabRange = (property.rehabMax || 0) - (property.rehabMin || 0);
  
  // SAME completion factor formula as flip logic for consistency
  // 0 = no rehab, 1 = full rehab at max end of range
  const rehabCompletionFactor = rehabRange > 0 
    ? Math.max(0, Math.min(1, (actualRehabSpend - (property.rehabMin || 0)) / rehabRange))
    : 1; // Property doesn't need significant rehab
  
  // ACTUAL RENT CALCULATION - tied to property condition (rehab) AND market knowledge
  let actualRent: number;
  const rentRange = property.rentMax - property.rentMin;
  
  if (didMarketStudy) {
    // WITH market study: Player knows the rent range, but actual rent depends on condition
    // Rehab completion determines WHERE in the range the rent lands
    // 0% rehab = rent at rentMin, 100% rehab = rent near rentMax
    const conditionBasedRent = property.rentMin + (rehabCompletionFactor * rentRange);
    
    // Small ±5% market variance (not a big swing since they did their homework)
    const marketVariance = 0.95 + (Math.random() * 0.10);
    actualRent = Math.round(conditionBasedRent * marketVariance);
    
    // If they skipped contractor walkthrough/inspection but property needs significant work,
    // they might not realize the property is in worse condition - "hidden damage" discovery
    // Same consequence concept as flip surprise costs, but applied to rent potential
    if (!didContractorWalkthrough && !didInspection && (property.rehabMin || 0) > 5000) {
      // "Surprise" - property condition is worse than assumed, tenants pay less
      const conditionPenalty = 0.85 + (Math.random() * 0.10); // 5-15% penalty
      actualRent = Math.round(actualRent * conditionPenalty);
    }
  } else {
    // WITHOUT market study: Player is flying blind on BOTH market AND condition
    // This is risky but NOT guaranteed failure - sometimes you get lucky
    
    // Base rent is condition-dependent but with uncertainty
    const conditionBasedRent = property.rentMin + (rehabCompletionFactor * rentRange);
    
    // Reality factor: Most of the time (75%) rent is lower due to ignorance
    // But ~25% of the time the property might perform at or above expectations (lucky!)
    const luckyRoll = Math.random();
    let realityFactor: number;
    if (luckyRoll < 0.25) {
      // 25% chance: Player got lucky - property performs well (90-115%)
      realityFactor = 0.90 + (Math.random() * 0.25);
    } else if (luckyRoll < 0.50) {
      // 25% chance: Property performs okay - slight discount (80-95%)
      realityFactor = 0.80 + (Math.random() * 0.15);
    } else {
      // 50% chance: Property underperforms as expected for no diligence (60-85%)
      realityFactor = 0.60 + (Math.random() * 0.25);
    }
    actualRent = Math.round(conditionBasedRent * realityFactor);
    
    // If they ALSO skipped condition diligence on a property needing work,
    // additional penalty - but still not 100% guaranteed underwater
    if (!didContractorWalkthrough && !didInspection && (property.rehabMin || 0) > 5000) {
      // 80% chance of blindness penalty, 20% chance of no extra penalty
      if (Math.random() < 0.80) {
        const blindnessPenalty = 0.85 + (Math.random() * 0.12); // 3-15% additional penalty
        actualRent = Math.round(actualRent * blindnessPenalty);
      }
    }
  }
  
  // MINIMAL safety floor - allow true failure but prevent completely absurd values
  // Players CAN get underwater if they skip diligence and make wrong assumptions
  // Floor at 50% of rentMin (vs flip which has no floor) - this allows "trap" outcomes
  const absoluteFloor = Math.round(property.rentMin * 0.50);
  const absoluteCeiling = Math.round(property.rentMax * 1.10);
  actualRent = Math.max(absoluteFloor, Math.min(absoluteCeiling, actualRent));

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

  // Track undiscovered issues for later consequences (maintenance problems, lower sale price)
  // NO upfront surprise costs for rentals - issues surface through:
  // 1. Higher maintenance event probability (3-5x via getAdjustedProbability)
  // 2. Lower sale price when selling (buyer's inspector finds issues)
  // Use randomized issues (matching what the client shows) based on game run + property
  const allIssuesForRental = property
    ? getRandomizedPropertyIssues(gameRun.id, deal.propertyId, property.propertyType, property.conditionTag, property.waterSource || 'public')
    : [];
  const undiscoveredIssues = allIssuesForRental.filter(issue =>
    !issue.discoveredBy.some(method => completedDiligence.includes(method))
  );
  
  // Check for title issues (20% chance if title search was skipped)
  // Title issues ARE immediate for rentals as they affect ownership
  const didTitleSearch = completedDiligence.includes('title_search');
  const titleIssue = checkForTitleIssue(didTitleSearch);
  let titleIssueName: string | undefined;
  let titleCost = 0;
  if (titleIssue.hasIssue) {
    titleCost = titleIssue.cost;
    titleIssueName = titleIssue.issueName;
  }
  
  // Only create ledger entry for title issues (immediate legal/ownership problem)
  // Property condition issues will surface through maintenance mechanics
  let newCash = gameRun.cash;
  if (titleCost > 0) {
    const ledgerEntry: Omit<InsertLedgerEntry, 'gameRunId' | 'balanceAfter'> = {
      direction: 'debit',
      category: 'expense',
      amount: titleCost,
      description: `📜 Title issue discovered: ${titleIssueName}`,
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
  
  // Use ACTUAL rent (reality-checked) for stored values - this is what player actually receives
  const monthlyGrossRent = actualRent;
  
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
  // Note: titleCost is the only immediate cost - property issues surface through maintenance
  const updatedProFormaOutputs = {
    ...proFormaOutputs,
    surpriseCosts: titleCost, // Only title issues are immediate costs for rentals
    totalCashInvested: (proFormaOutputs?.totalCashInvested || 0) + titleCost,
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
    // Store ACTUAL values for weekly processing (reality-checked)
    monthlyGrossRent,
    cashFlowMonthly: actualCashFlowMonthly, // Store actual cash flow for display
    realityAdjustmentMonthly,
  };

  // Get loan details from pro forma for tracking
  const initialLoanBalance = proFormaOutputs?.loanAmount || 0;
  const loanInterestRate = proFormaOutputs?.interestRate || 6.5;
  const loanTermMonths = proFormaOutputs?.loanTermMonths || 360;
  
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
    surpriseCosts: titleCost, // Only title issues cause immediate costs for rentals
    surpriseIssues: allSurpriseIssues,
    titleIssue: titleIssue.hasIssue ? { name: titleIssueName!, cost: titleIssue.cost } : undefined,
    newCash,
    realityCheck,
  };
}

/**
 * Start a flip - either with rehab (in_rehab status) or without (ready_to_list immediately)
 * If rehabWeeks is 0 (no renovation planned), property goes directly to ready_to_list
 * This allows "quick flips" but at reduced sale price since no improvements were made
 */
export async function startFlipRehab(
  deal: Deal,
  rehabWeeks: number
): Promise<Deal> {
  // If no rehab planned (0 weeks), skip straight to ready_to_list
  // Player can sell immediately but at reduced ARV (property wasn't improved)
  if (rehabWeeks <= 0) {
    const updatedDeal = await storage.updateDeal(deal.id, {
      status: 'ready_to_list',
      weeksUntilCompletion: 0,
    });
    return updatedDeal!;
  }
  
  // Normal rehab path - requires time to complete renovations
  const updatedDeal = await storage.updateDeal(deal.id, {
    status: 'in_rehab',
    weeksUntilCompletion: rehabWeeks,
  });

  return updatedDeal!;
}

/**
 * Contractor Walkthrough for Owned Rentals
 * 
 * Allows players to discover property issues post-purchase by hiring a contractor.
 * Costs $400-800 and reveals itemized repairs with costs typically 30-50% higher
 * than pre-purchase due diligence would have found (reactive vs proactive repairs).
 */
export interface ContractorWalkthroughItem {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  originalCost: number;       // What it would have cost via due diligence
  contractorCost: number;     // Higher cost for post-purchase discovery
  timelineWeeks: number;
  description: string;
  markup: number;             // Percentage markup applied
  rentImpactPct: number;      // How much this repair boosts rent (e.g. 3 = +3%)
}

const RENT_IMPACT_BY_REPAIR: Record<string, number> = {
  cosmetic_updates: 8,
  hvac_replacement: 6,
  outdated_hvac: 5,
  hvac_commercial: 5,
  hvac_high_rise: 5,
  dual_hvac: 5,
  electrical_upgrade: 4,
  electrical_outdated: 3,
  plumbing_galvanized: 3,
  plumbing_replacement: 3,
  plumbing_stack: 3,
  roof_wear: 2,
  roof_replacement: 3,
  roof_shared: 2,
  roof_historic: 3,
  window_seals: 4,
  historic_windows: 5,
  foundation_settling: 1,
  foundation_major: 1,
  structural_settling: 1,
  drainage_issues: 1,
  mold_remediation: 4,
  basement_moisture: 2,
  termite_damage: 2,
  asbestos_tiles: 2,
  lead_paint: 2,
  lead_paint_abatement: 2,
  radon_mitigation: 2,
  septic_issues: 1,
  septic_maintenance: 1,
  well_water: 1,
  well_pump: 1,
  siding_damage: 3,
  brick_repointing: 3,
  porch_rot: 3,
  chimney_rebuild: 1,
  knob_tube: 3,
  fire_suppression: 2,
  loading_dock: 1,
  dock_repair: 2,
  dock_permit: 1,
  sump_pump: 1,
  salt_corrosion: 2,
  hurricane_straps: 1,
  wood_stove: 1,
  irrigation_repair: 2,
  pool_resurface: 5,
  pool_equipment: 4,
  industrial_conversion: 3,
  hoa_assessment: 0,
  hoa_assessment_pending: 0,
  hoa_reserve_low: 0,
  high_hoa_fees: 0,
  building_systems: 3,
  parking_issues: 2,
  historic_requirements: 2,
  elevator_issues: 3,
  shared_wall_issues: 2,
  city_violations: 1,
  narrow_lot_access: 0,
  separate_utilities: 2,
  utility_separation: 2,
  dual_system_updates: 3,
  deferred_maintenance: 4,
  zoning_issues: 0,
  seawall_maintenance: 2,
  barn_roof: 1,
};

function getRentImpactForRepair(issueId: string, severity: 'mild' | 'moderate' | 'severe', random: () => number): number {
  const baseImpact = RENT_IMPACT_BY_REPAIR[issueId];
  if (baseImpact !== undefined) {
    const variance = (random() - 0.5) * 2;
    return Math.max(0, Math.round((baseImpact + variance) * 10) / 10);
  }
  const severityDefaults: Record<string, number> = { mild: 2, moderate: 4, severe: 3 };
  const fallback = severityDefaults[severity] || 2;
  const variance = (random() - 0.5) * 2;
  return Math.max(0, Math.round((fallback + variance) * 10) / 10);
}

export interface ContractorWalkthroughResult {
  walkthroughFee: number;
  repairItems: ContractorWalkthroughItem[];
  totalRepairCost: number;
  totalOriginalCost: number;
  averageMarkup: number;
  foundTreasure?: boolean;
  treasureAmount?: number;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export async function performContractorWalkthrough(
  dealId: number,
  gameRunId: number
): Promise<{ success: boolean; result?: ContractorWalkthroughResult; error?: string }> {
  // Get the deal
  const deal = await storage.getDeal(dealId);
  if (!deal) {
    return { success: false, error: 'Deal not found' };
  }

  // Must be an active rental
  if (deal.status !== 'active_rental') {
    return { success: false, error: 'Property must be an active rental' };
  }

  // Must not have already done walkthrough
  if (deal.contractorWalkthroughCompleted) {
    return { success: false, error: 'Contractor walkthrough already completed' };
  }

  // Get game run and property
  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) {
    return { success: false, error: 'Game run not found' };
  }

  const property = await storage.getProperty(deal.propertyId);
  if (!property) {
    return { success: false, error: 'Property not found' };
  }

  // Generate walkthrough fee ($400-800)
  const random = seededRandom(dealId * 1000 + gameRun.currentWeek);
  const walkthroughFee = Math.round(400 + random() * 400);

  // Check if player can afford
  if (gameRun.cash < walkthroughFee) {
    return { success: false, error: `Insufficient funds. Need $${walkthroughFee.toLocaleString()}` };
  }

  // Get issues that would be discovered by contractor walkthrough
  // Use randomized issues based on property type, or fall back to static issues
  const allIssues = getRandomizedPropertyIssues(gameRunId, deal.propertyId, property.propertyType, property.conditionTag, property.waterSource || 'public');
  const contractorIssues = allIssues.filter(issue => 
    issue.discoveredBy.includes('contractor_walkthrough')
  );

  // Generate repair items with markup (30-50% higher than original)
  const repairItems: ContractorWalkthroughItem[] = contractorIssues.map((issue, index) => {
    const itemRandom = seededRandom(dealId * 100 + index);
    
    // Original cost would be from due diligence (mid-range)
    const originalCost = Math.round((issue.costRangeMin + issue.costRangeMax) / 2);
    
    // Markup typically 30-50%, with rare exceptions for realism
    const markupChance = itemRandom();
    let markup: number;
    if (markupChance < 0.05) {
      // 5% chance of NO markup (very lucky find)
      markup = 0;
    } else if (markupChance < 0.15) {
      // 10% chance of small markup (15-25%)
      markup = 15 + itemRandom() * 10;
    } else {
      // 85% chance of significant markup (30-50%) - the typical case
      markup = 30 + itemRandom() * 20;
    }
    
    const contractorCost = Math.round(originalCost * (1 + markup / 100));
    
    const rentImpactPct = getRentImpactForRepair(issue.id, issue.severity, itemRandom);
    
    return {
      id: issue.id,
      name: issue.name,
      severity: issue.severity,
      originalCost,
      contractorCost,
      timelineWeeks: issue.timelineImpactWeeks,
      description: issue.description,
      markup: Math.round(markup),
      rentImpactPct,
    };
  });

  const totalRepairCost = repairItems.reduce((sum, item) => sum + item.contractorCost, 0);
  const totalOriginalCost = repairItems.reduce((sum, item) => sum + item.originalCost, 0);
  const averageMarkup = totalOriginalCost > 0 
    ? Math.round(((totalRepairCost - totalOriginalCost) / totalOriginalCost) * 100) 
    : 0;

  // HIDDEN TREASURE: 1/300 chance (~0.33%) of finding gold bars under floorboards!
  // This is exceedingly rare but exciting when it happens
  const treasureRoll = seededRandom(dealId * 7777 + gameRun.currentWeek * 13)();
  const foundTreasure = treasureRoll < (1 / 300);
  const treasureAmount = foundTreasure ? 100000 : 0;

  const result: ContractorWalkthroughResult = {
    walkthroughFee,
    repairItems,
    totalRepairCost,
    totalOriginalCost,
    averageMarkup,
    foundTreasure,
    treasureAmount,
  };

  // Deduct walkthrough fee from cash, add treasure if found
  let newCash = gameRun.cash - walkthroughFee;
  if (foundTreasure) {
    newCash += treasureAmount;
  }
  await storage.updateGameRun(gameRunId, { cash: newCash });

  // Create ledger entry for the walkthrough fee
  const ledgerEntry: InsertLedgerEntry = {
    gameRunId,
    direction: 'debit',
    category: 'expense',
    amount: walkthroughFee,
    balanceAfter: newCash,
    description: `Contractor walkthrough - ${property.name}`,
    propertyId: property.id,
    dealId: deal.id,
    gameWeek: gameRun.currentWeek,
  };
  await storage.createLedgerEntry(ledgerEntry);

  // If treasure found, create a credit ledger entry for the gold!
  if (foundTreasure) {
    const treasureLedgerEntry: InsertLedgerEntry = {
      gameRunId,
      direction: 'credit',
      category: 'income',
      amount: treasureAmount,
      balanceAfter: newCash,
      description: `HIDDEN TREASURE! Gold bars found under floorboards - ${property.name}`,
      propertyId: property.id,
      dealId: deal.id,
      gameWeek: gameRun.currentWeek,
    };
    await storage.createLedgerEntry(treasureLedgerEntry);
  }

  // Update deal with walkthrough completion
  await storage.updateDeal(dealId, {
    contractorWalkthroughCompleted: true,
    contractorWalkthroughData: result,
  });

  // Also record this as an investigation for consistency
  await storage.createPropertyInvestigation({
    gameRunId,
    propertyId: property.id,
    investigationType: 'contractor_walkthrough',
    revealedData: result,
    cost: walkthroughFee,
    weeksUsed: 0, // Happens instantly
  });

  return { success: true, result };
}

/**
 * Initiate Rental Rehab
 * 
 * Starts repairs on an active rental property based on contractor walkthrough findings.
 * - Tenant is displaced with 1 month break fee
 * - Property becomes vacant during rehab
 * - Timeline varies by issue type with contractor schedule variance
 * - Occasional cost overruns
 */
export interface RentalRehabResult {
  success: boolean;
  error?: string;
  totalCost?: number;
  breakFee?: number;
  estimatedWeeks?: number;
  actualWeeks?: number;
  timelineVariance?: string; // 'early' | 'on_time' | 'late'
  costOverrun?: number;
}

export async function initiateRentalRehab(
  dealId: number,
  gameRunId: number,
  selectedRepairIds?: string[]
): Promise<RentalRehabResult> {
  // Validate deal exists and is an active rental
  const deal = await storage.getDeal(dealId);
  if (!deal) {
    return { success: false, error: 'Deal not found' };
  }
  if (deal.gameRunId !== gameRunId) {
    return { success: false, error: 'Deal does not belong to this game' };
  }
  if (deal.status !== 'active_rental') {
    return { success: false, error: 'Property must be an active rental' };
  }
  if (!deal.contractorWalkthroughCompleted) {
    return { success: false, error: 'Must complete contractor walkthrough first' };
  }
  if (deal.rentalRehabActive) {
    return { success: false, error: 'Rehab already in progress' };
  }

  // Get walkthrough data
  const walkthroughData = deal.contractorWalkthroughData as ContractorWalkthroughResult | null;
  if (!walkthroughData || !walkthroughData.repairItems || walkthroughData.repairItems.length === 0) {
    return { success: false, error: 'No repair items found from walkthrough' };
  }

  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) {
    return { success: false, error: 'Game run not found' };
  }

  const property = await storage.getProperty(deal.propertyId);
  if (!property) {
    return { success: false, error: 'Property not found' };
  }

  // Get valid repair IDs from walkthrough data, excluding previously completed repairs
  const previouslyCompletedIds = (deal.completedRepairIds as string[] | null) || [];
  const availableRepairItems = walkthroughData.repairItems.filter(
    item => !previouslyCompletedIds.includes(item.id)
  );
  
  if (availableRepairItems.length === 0) {
    return { success: false, error: 'All repairs have already been completed' };
  }
  
  const validRepairIds = new Set(availableRepairItems.map(item => item.id));
  
  // Validate selectedRepairIds if provided - must be subset of available (not yet completed) IDs
  if (selectedRepairIds && selectedRepairIds.length > 0) {
    const invalidIds = selectedRepairIds.filter(id => !validRepairIds.has(id));
    if (invalidIds.length > 0) {
      return { success: false, error: `Invalid repair IDs: ${invalidIds.join(', ')}` };
    }
  }
  
  // Filter to only selected repairs (if specified), otherwise use all available
  const repairItems = selectedRepairIds && selectedRepairIds.length > 0
    ? availableRepairItems.filter(item => selectedRepairIds.includes(item.id))
    : availableRepairItems;
  
  if (repairItems.length === 0) {
    return { success: false, error: 'No repairs selected' };
  }

  // Calculate tenant break fee (1 month of current rent)
  const monthlyRent = (deal.weeklyIncome || 0) * 4.33;
  const breakFee = Math.round(monthlyRent);

  // Calculate base rehab cost and timeline from SELECTED items only
  const baseCost = repairItems.reduce((sum, item) => sum + item.contractorCost, 0);
  
  // Timeline: Use MAX of selected item timelines (work done in parallel where possible)
  const baseWeeks = Math.max(...repairItems.map(item => item.timelineWeeks), 1);

  // TIMELINE VARIANCE: Contractors can run early, on-time, or late
  // 15% under time (-1-2 weeks), 25% on time, 60% over time (+1-3 weeks)
  const timelineRoll = seededRandom(dealId * 999 + gameRun.currentWeek)();
  let timelineVariance: 'early' | 'on_time' | 'late';
  let varianceWeeks: number;
  
  if (timelineRoll < 0.15) {
    // 15% chance: Early finish (contractor ahead of schedule)
    timelineVariance = 'early';
    varianceWeeks = -Math.floor(1 + seededRandom(dealId * 888)() * Math.min(2, baseWeeks - 1));
  } else if (timelineRoll < 0.40) {
    // 25% chance: On time
    timelineVariance = 'on_time';
    varianceWeeks = 0;
  } else {
    // 60% chance: Running late
    timelineVariance = 'late';
    varianceWeeks = Math.ceil(1 + seededRandom(dealId * 777)() * 2); // +1-3 weeks
  }
  
  const actualWeeks = Math.max(1, baseWeeks + varianceWeeks);

  // COST OVERRUNS: 20% chance of cost increase
  const overrunRoll = seededRandom(dealId * 666 + gameRun.currentWeek * 7)();
  let costOverrun = 0;
  if (overrunRoll < 0.20) {
    // 10-25% cost increase
    const overrunPct = 10 + seededRandom(dealId * 555)() * 15;
    costOverrun = Math.round(baseCost * (overrunPct / 100));
  }
  
  const actualCost = baseCost + costOverrun;
  const totalCost = breakFee + actualCost;

  // Check if player can afford
  if (gameRun.cash < totalCost) {
    return { 
      success: false, 
      error: `Insufficient funds. Need $${totalCost.toLocaleString()} (${breakFee.toLocaleString()} break fee + $${actualCost.toLocaleString()} repairs)`
    };
  }

  // Deduct costs from cash
  const newCash = gameRun.cash - totalCost;
  await storage.updateGameRun(gameRunId, { cash: newCash });

  // Create ledger entries
  const ledgerEntries: InsertLedgerEntry[] = [
    {
      gameRunId,
      direction: 'debit',
      category: 'expense',
      amount: breakFee,
      balanceAfter: gameRun.cash - breakFee,
      description: `Tenant break fee (1 month rent) - ${property.name}`,
      propertyId: property.id,
      dealId: deal.id,
      gameWeek: gameRun.currentWeek,
    },
    {
      gameRunId,
      direction: 'debit',
      category: 'expense',
      amount: actualCost,
      balanceAfter: newCash,
      description: `Rental rehab started - ${property.name}${costOverrun > 0 ? ` (includes $${costOverrun.toLocaleString()} overrun)` : ''}`,
      propertyId: property.id,
      dealId: deal.id,
      gameWeek: gameRun.currentWeek,
    }
  ];

  for (const entry of ledgerEntries) {
    await storage.createLedgerEntry(entry);
  }

  // Update deal to rental rehab state - store only selected repair items
  await storage.updateDeal(dealId, {
    rentalRehabActive: true,
    rentalRehabWeeksRemaining: actualWeeks,
    rentalRehabBaseWeeks: baseWeeks,
    rentalRehabCostBase: baseCost,
    rentalRehabCostActual: actualCost,
    rentalRehabVariancePct: Math.round((varianceWeeks / baseWeeks) * 100),
    rentalRehabStartWeek: gameRun.currentWeek,
    rentalRehabItems: repairItems, // Only selected items
    tenantDisplaced: true,
    tenantBreakFee: breakFee,
    weeklyIncome: 0, // No rent during rehab (vacant)
  });

  return {
    success: true,
    totalCost,
    breakFee,
    estimatedWeeks: baseWeeks,
    actualWeeks,
    timelineVariance,
    costOverrun: costOverrun > 0 ? costOverrun : undefined,
  };
}
