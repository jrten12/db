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
import type { GameRun, Deal, Property, InsertLedgerEntry, InsertCurveballEvent, MarketCondition } from '@shared/schema';
import { MARKET_CONDITIONS } from '@shared/schema';
import * as schema from '@shared/schema';
import { db } from './storage';
import { eq } from 'drizzle-orm';
import { rollForCurveball, rollForCurveballWithIssues, type PropertyContext, type CurveballResult, normalizeConditionTag, normalizePropertyType, normalizeLocationType } from '../client/src/lib/curveballs';
import { calculateSurpriseCosts, PropertyIssue, getRandomizedPropertyIssues, RENT_IMPACT_BY_ISSUE, getAvailableUpgrades, type PropertyUpgrade, PROPERTY_UPGRADES } from '@shared/propertyIssues';

export interface FlipPricingParams {
  purchasePrice: number;
  rehabBudget: number;
  finishLevel: string;
  contingencyPct: number;
  arvMin: number;
  arvMax: number;
  rehabMax: number;
  playerArvEstimate?: number;
  didComps: boolean;
  diligenceCount: number;
  conditionPenalty?: number;
  fixedBonus?: number;
  marketMult: { min: number; max: number };
  renovationArvBoostPct?: number;
}

export function calculateFlipSalePrice(params: FlipPricingParams): number {
  const {
    purchasePrice, rehabBudget, finishLevel, contingencyPct,
    arvMin, arvMax, rehabMax, playerArvEstimate,
    didComps, diligenceCount, conditionPenalty = 0, fixedBonus = 0, marketMult,
    renovationArvBoostPct = 0
  } = params;

  const finishCostMult = finishLevel === 'luxury' ? 1.4 : 1.0;
  const finishArvBoost = (finishLevel === 'luxury' ? 0.10 : 0) + (renovationArvBoostPct / 100);
  const adjustedRehabBudget = Math.round(rehabBudget * finishCostMult);
  const actualRehabSpend = adjustedRehabBudget * (1 + contingencyPct / 100);

  const fullRehabCost = rehabMax;
  const completionFactor = fullRehabCost > 0
    ? Math.max(0, Math.min(1, actualRehabSpend / fullRehabCost))
    : 0;

  const maxArv = Math.round(arvMax * (1 + finishArvBoost));

  const diligenceBonusPct = diligenceCount === 0 ? 0
    : diligenceCount === 1 ? 0.02
    : diligenceCount === 2 ? 0.04
    : diligenceCount === 3 ? 0.06
    : 0.08;
  const diligenceBonusMultiplier = 1 + diligenceBonusPct;

  const conditionMultiplier = Math.max(0.80, 1 - conditionPenalty);

  const windfallEligible = completionFactor >= 0.3 && diligenceCount >= 2;
  const windfallMultiplier = (windfallEligible && Math.random() < 0.03)
    ? 1.08 + (Math.random() * 0.07)
    : 1.0;

  let salePrice: number;

  if (didComps) {
    const baseSpreadCapture = diligenceCount >= 3 ? 0.95 : 0.90;
    const effectiveSpreadCapture = baseSpreadCapture * Math.pow(completionFactor, 0.7);
    const priceSpread = maxArv - purchasePrice;
    let baseSalePrice = purchasePrice + (effectiveSpreadCapture * priceSpread);
    baseSalePrice = baseSalePrice * (1 + fixedBonus);
    baseSalePrice = baseSalePrice * conditionMultiplier;
    baseSalePrice = baseSalePrice * diligenceBonusMultiplier;

    const marketVariance = marketMult.min + (Math.random() * (marketMult.max - marketMult.min));
    salePrice = Math.round(baseSalePrice * marketVariance * windfallMultiplier);

    if (rehabBudget === 0) {
      const noRehabCap = diligenceCount >= 3
        ? purchasePrice * 1.02
        : purchasePrice * 0.97;
      salePrice = Math.min(salePrice, Math.round(noRehabCap));
    } else if (completionFactor < 0.25) {
      const minRehabCap = purchasePrice * 1.05;
      salePrice = Math.min(salePrice, Math.round(minRehabCap));
    }
  } else {
    const playerEstimate = playerArvEstimate || ((arvMin + arvMax) / 2);
    const baseRealityMin = 0.72 * marketMult.min;
    const baseRealityMax = 1.10 * marketMult.max;
    const realityFactor = baseRealityMin + (Math.random() * (baseRealityMax - baseRealityMin));

    const priceSpread = maxArv - purchasePrice;
    let actualValue = purchasePrice + (Math.pow(completionFactor, 0.7) * priceSpread * 0.82);
    actualValue = actualValue * (1 + fixedBonus);
    actualValue = actualValue * conditionMultiplier;

    const uncertainPrice = playerEstimate * realityFactor;
    salePrice = Math.round((uncertainPrice * 0.35) + (actualValue * 0.65));

    if (rehabBudget === 0) {
      salePrice = Math.min(salePrice, Math.round(purchasePrice * 0.94));
    } else if (completionFactor < 0.25) {
      salePrice = Math.min(salePrice, Math.round(purchasePrice * 1.02));
    }
  }

  salePrice = Math.max(salePrice, Math.round(purchasePrice * 0.55));
  return salePrice;
}

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
      return { min: 0.90, max: 0.98 };
    case 'poor':
      return { min: 0.93, max: 1.06 };
    case 'neutral':
      return { min: 0.96, max: 1.08 };
    case 'good':
      return { min: 0.98, max: 1.12 };
    case 'excellent':
      return { min: 1.02, max: 1.18 };
    default:
      return { min: 0.95, max: 1.08 };
  }
}

/**
 * Randomize starting market condition (BAL-003 fix, BAL-004 rebalance)
 * Weighted distribution: any state is possible but slightly friendlier start
 * Weights: terrible 5%, poor 10%, neutral 25%, good 35%, excellent 25% (BAL-006: friendlier starts)
 */
export function getRandomStartingMarket(): MarketCondition {
  const rand = Math.random();
  if (rand < 0.05) return 'terrible';
  if (rand < 0.15) return 'poor';
  if (rand < 0.40) return 'neutral';
  if (rand < 0.75) return 'good';
  return 'excellent';
}

/**
 * Progress market condition with rebalanced weights (BAL-003 fix)
 * Poor/Terrible probability weights increased by 25% vs original
 * 
 * Adjusted transition probabilities:
 * From terrible (0): 75% up, 25% stay (faster recovery)
 * From poor (1): 60% up, 20% stay, 20% down
 * From neutral (2): 55% up, 25% stay, 20% down (slight upward bias)
 * From good (3): 30% up, 35% stay, 30% down to neutral, 5% crash to poor
 * From excellent (4): 45% stay, 42% down to good, 10% to neutral, 3% crash to poor
 */
export function progressMarketCondition(currentCondition: MarketCondition): MarketCondition {
  const currentIndex = MARKET_CONDITIONS.indexOf(currentCondition);
  const rand = Math.random();
  
  let newIndex: number;
  
  switch (currentIndex) {
    case 0: // terrible - faster recovery
      newIndex = rand < 0.75 ? 1 : 0;
      break;
    case 1: // poor - stronger upward pull
      if (rand < 0.60) newIndex = 2;
      else if (rand < 0.80) newIndex = 1;
      else newIndex = 0;
      break;
    case 2: // neutral - slight upward bias
      if (rand < 0.55) newIndex = 3;
      else if (rand < 0.80) newIndex = 2;
      else newIndex = 1;
      break;
    case 3: // good - more stable, reduced crash chance (BAL-006: crash 5%→2%)
      if (rand < 0.35) newIndex = 4;
      else if (rand < 0.70) newIndex = 3;
      else if (rand < 0.98) newIndex = 2;
      else newIndex = 1; // 2% crash to poor
      break;
    case 4: // excellent - more stable, gentler corrections (BAL-006: crash 3%→1%)
      if (rand < 0.50) newIndex = 4;
      else if (rand < 0.90) newIndex = 3;
      else if (rand < 0.99) newIndex = 2;
      else newIndex = 1; // 1% crash to poor
      break;
    default:
      newIndex = 2;
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
 * Compute market-driven price drift when market condition changes.
 * Returns a small percentage change to add to the cumulative priceDriftPct.
 * 
 * Drift ranges per market condition (applied each ~4-week cycle):
 *   Terrible:  -1.2% to -0.4%  (prices falling in bad market)
 *   Poor:      -0.4% to +0.1%  (stagnant/slightly declining)
 *   Neutral:   +0.0% to +0.5%  (normal appreciation/inflation)
 *   Good:      +0.3% to +1.0%  (rising market)
 *   Excellent: +0.6% to +1.5%  (hot market appreciation)
 * 
 * Cumulative drift is capped at ±20% to keep the game balanced.
 */
export function computePriceDrift(marketCondition: MarketCondition, currentDriftPct: number): number {
  const DRIFT_CAP = 20;

  const driftRanges: Record<MarketCondition, { min: number; max: number }> = {
    terrible:  { min: -1.2, max: -0.4 },
    poor:      { min: -0.4, max: 0.1 },
    neutral:   { min: 0.0,  max: 0.5 },
    good:      { min: 0.3,  max: 1.0 },
    excellent: { min: 0.6,  max: 1.5 },
  };

  const range = driftRanges[marketCondition] || driftRanges.neutral;
  const drift = range.min + Math.random() * (range.max - range.min);
  const newDrift = Math.round((currentDriftPct + drift) * 100) / 100;
  return Math.max(-DRIFT_CAP, Math.min(DRIFT_CAP, newDrift));
}

/**
 * Apply price drift to a property's monetary values.
 * Returns adjusted values based on cumulative drift percentage.
 */
export function applyPriceDrift<T extends { price: number; rentMin: number; rentMax: number; arvMin: number; arvMax: number }>(
  property: T,
  driftPct: number
): T {
  if (!driftPct || driftPct === 0) return property;
  const mult = 1 + driftPct / 100;
  return {
    ...property,
    price: Math.round(property.price * mult),
    rentMin: Math.round(property.rentMin * mult),
    rentMax: Math.round(property.rentMax * mult),
    arvMin: Math.round(property.arvMin * mult),
    arvMax: Math.round(property.arvMax * mult),
  };
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
  
  // Each game turn = 1 month, so use monthly values directly
  const weeklyInterest = Math.round(amort.interestPayment);
  const weeklyPrincipal = Math.round(amort.principalPayment);
  
  // Accelerated principal for loan balance tracking (bookkeeping only, not cash)
  // This simulates multiple months of principal paydown per game turn
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

import { rollForEnhancedMaintenance, updateRecentCurveballIds, ENHANCED_MAINTENANCE_EVENTS, getUnfixedIssues, getProgressiveEscalationMultiplier } from './maintenanceMechanics';

/**
 * Title Issue Types that can occur when skipping title search
 */
const TITLE_ISSUES = [
  { name: 'Unknown lien', minCost: 3000, maxCost: 15000 },
  { name: 'Unpaid property taxes', minCost: 1500, maxCost: 10000 },
  { name: 'Mechanics lien from previous owner', minCost: 2000, maxCost: 12000 },
  { name: 'Boundary dispute resolution', minCost: 3000, maxCost: 20000 },
  { name: 'Easement clearance', minCost: 1500, maxCost: 8000 },
  { name: 'Estate heir claim settlement', minCost: 3000, maxCost: 15000 },
  { name: 'Forged deed in chain of title', minCost: 5000, maxCost: 25000 },
  { name: 'Outstanding HOA liens', minCost: 1000, maxCost: 6000 },
  { name: 'Judgment lien from previous owner', minCost: 3000, maxCost: 12000 },
  { name: 'Unpaid contractor liens', minCost: 2000, maxCost: 8000 },
];

/**
 * Check for title issues when player skipped title search
 * 15% chance of a title issue occurring (BAL-008), with costs ranging $1,000-$25,000
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
  
  // 15% chance of title issue when skipping title search (BAL-008)
  const roll = Math.random();
  if (roll > 0.15) {
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
    tenantMessage?: string | null;
    fromIssue?: boolean;
    issueId?: string;
  };
  latePayment?: {
    amount: number;
    tenantMessage: string;
    tenantName: string;
  };
  newCash: number;
  dealId: number;
  principalPaid?: number;
  interestPaid?: number;
  remainingBalance?: number;
  proFormaComparison?: {
    projectedRent: number;
    actualRent: number;
    projectedExpenses: number;
    actualExpenses: number;
    projectedCashFlow: number;
    actualCashFlow: number;
    rentDelta: number;
    expenseDelta: number;
    explanation: string;
    wasOptimistic: boolean;
    propertyName: string;
  };
}

interface CompletedRentalRehab {
  dealId: number;
  propertyName: string;
  newMonthlyRent: number;
  previousRent: number;
  newNetRent: number;
  previousNetRent: number;
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
  passiveIncomeMilestones?: number[];
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

  // Get property to access ARV and rehab ranges (apply market drift)
  const rawProperty = await storage.getProperty(deal.propertyId);
  const property = rawProperty ? applyPriceDrift(rawProperty, gameRun.priceDriftPct ?? 0) : rawProperty;
  
  // Get market multipliers for current conditions
  const market = marketCondition || (gameRun.marketCondition as MarketCondition) || 'good';
  const marketMult = getMarketMultipliers(market);
  
  // Check if player did due diligence (appraisal = comp analysis)
  const investigations = await storage.getPropertyInvestigations(gameRun.id);
  const completedDiligence = investigations
    .filter(inv => inv.propertyId === deal.propertyId)
    .map(inv => inv.investigationType);
  const didComps = completedDiligence.includes('appraisal');

  // Calculate diligence depth bonus
  // Informed investors price better, market effectively, negotiate from strength
  // Each property-investigation type (appraisal, contractor_walkthrough, inspection, title_search) counts
  const diligenceTypes = ['appraisal', 'contractor_walkthrough', 'inspection', 'title_search'];
  const diligenceCount = diligenceTypes.filter(d => completedDiligence.includes(d)).length;
  // 0 types = 0%, 1 = +2%, 2 = +4%, 3 = +6%, 4 = +8% (BAL-008: rewarding thorough diligence)
  const diligenceBonusPct = diligenceCount === 0 ? 0
    : diligenceCount === 1 ? 0.02
    : diligenceCount === 2 ? 0.04
    : diligenceCount === 3 ? 0.06
    : 0.08;
  const diligenceBonusMultiplier = 1 + diligenceBonusPct;
  
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
  
  // Calculate sale price using shared flip pricing function
  let salePrice: number;
  if (property && property.arvMin && property.arvMax && property.rehabMin && property.rehabMax) {
    const purchasePrice = deal.purchasePrice || proFormaInputs?.purchasePrice || property.arvMin * 0.7;
    const rawRehabBudget = proFormaInputs?.rehabBudget || 0;

    // Calculate CONDITION PENALTY from ALL unfixed issues (both undiscovered AND known-but-skipped)
    const rawFixedIssueIds = proFormaInputs?.fixedIssueIds || [];
    const fixedIssueIds = [...new Set(rawFixedIssueIds)].filter(id => allIssues.some(i => i.id === id));
    const discoveredButSkipped = allIssues.filter(issue =>
      issue.discoveredBy.some(method => completedDiligence.includes(method)) &&
      !fixedIssueIds.includes(issue.id)
    );
    const undiscoveredCount = undiscoveredIssues.length;
    const skippedCount = discoveredButSkipped.length;
    const conditionPenalty = (undiscoveredCount * 0.02) + (skippedCount * 0.015);
    const fixedCount = fixedIssueIds.length;
    const fixedBonus = fixedCount > 0 ? Math.min(fixedCount * 0.01, 0.05) : 0;

    const selectedRenovationIds = proFormaInputs?.selectedRenovationIds || [];
    const renovationArvBoostPct = selectedRenovationIds
      .map((id: string) => PROPERTY_UPGRADES.find(u => u.id === id))
      .filter(Boolean)
      .reduce((sum: number, u: any) => sum + (u.saleImpactPct || 0), 0);

    salePrice = calculateFlipSalePrice({
      purchasePrice,
      rehabBudget: rawRehabBudget,
      finishLevel: proFormaInputs?.finishLevel || 'builder',
      contingencyPct: proFormaInputs?.contingencyPct || 10,
      arvMin: property.arvMin,
      arvMax: property.arvMax,
      rehabMax: property.rehabMax,
      playerArvEstimate: proFormaInputs?.arv,
      didComps,
      diligenceCount,
      conditionPenalty,
      fixedBonus,
      marketMult,
      renovationArvBoostPct,
    });
  } else {
    salePrice = proFormaOutputs.arv || 0;
  }
  
  const cosmeticSaleBoost = proFormaOutputs?.cosmeticUpgradeSaleBoost || 0;
  if (cosmeticSaleBoost > 0) {
    salePrice = Math.round(salePrice * (1 + cosmeticSaleBoost / 100));
  }

  let cashImpact = curveball?.cashImpact || 0;

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
  // Diligent investors who did comp analysis negotiate better agent terms and price
  // more accurately, reducing days on market and overall selling costs
  const baseSellingCostsPct = proFormaInputs?.sellingCostsPct || 5;
  const sellingCostDiscount = didComps ? 1.5 : 0; // 1.5% discount with comp analysis
  const sellingCostsPct = Math.max(3, baseSellingCostsPct - sellingCostDiscount);
  const sellingCosts = Math.round(salePrice * (sellingCostsPct / 100));

  // Calculate total holding costs already paid (for profit calculation only)
  // These were already deducted from cash weekly, so we just need the total for ROI display
  const loanAmount = proFormaOutputs?.loanAmount || 0;
  const interestRate = proFormaInputs?.interestRate || deal.loanInterestRate || 0;
  const taxesAnnual = proFormaInputs?.taxesAnnual || 0;
  const insuranceAnnual = proFormaInputs?.insuranceAnnual || 0;
  const rehabWeeks = deal.weeksUntilCompletion || proFormaInputs?.rehabWeeks || 0;
  const holdingCostPerMonth = Math.round(
    (loanAmount * (interestRate / 100) / 12) +
    (taxesAnnual / 12) +
    (insuranceAnnual / 12)
  );
  const totalHoldingCostsPaid = holdingCostPerMonth * rehabWeeks;

  const allInCost = proFormaOutputs.allInBasis || 0;
  const profit = salePrice - allInCost - totalHoldingCostsPaid - sellingCosts - surpriseCosts;

  // Calculate mortgage payoff
  const mortgagePayoff = deal.currentLoanBalance ?? loanAmount ?? 0;

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

  // Mortgage payoff (loan repayment from sale proceeds)
  if (mortgagePayoff > 0) {
    ledgerEntries.push({
      direction: 'debit',
      category: 'expense',
      amount: mortgagePayoff,
      description: `Mortgage payoff`,
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

  // Update profitable deals count if profit > 0 (only if still within 52 weeks)
  if (profit > 0 && gameRun.weeksRemaining > 0) {
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
      const capexPct = proFormaInputs?.capExPct || 8;
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
      const playerCashFlowMonthly = proFormaOutputs?.cashFlowMonthly || storedWeeklyIncome;
      
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
  
  const hasPropertyMgmtForDiscount = proFormaInputs?.propertyManagement || false;
  const isTenantDeparture = curveball?.id === 'tenant_departure_conditions' || curveball?.id === 'tenant_departure_life';
  if (hasPropertyMgmtForDiscount && cashImpact < 0 && !isTenantDeparture) {
    cashImpact = Math.round(cashImpact * 0.9);
  }
  
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

  // Record curveball event if one occurred (using discounted cashImpact if PM applied)
  if (curveball) {
    await db.insert(schema.curveballEvents).values({
      gameRunId: gameRun.id,
      dealId: deal.id,
      curveballId: curveball.id,
      name: curveball.name,
      type: curveball.type,
      description: curveball.description,
      cashImpact: cashImpact,
      timeImpact: curveball.timeImpact || 0,
      emoji: curveball.emoji,
      gameWeek: gameRun.currentWeek,
    });
    
    // Handle tenant departures - delete tenant so a new one is auto-created next month
    if (curveball.id === 'early_lease_break' || 
        curveball.id === 'tenant_departure_conditions' || 
        curveball.id === 'tenant_departure_life') {
      const oldTenant = await storage.getTenantByDeal(deal.id);
      if (oldTenant) {
        await db.delete(schema.tenants).where(eq(schema.tenants.id, oldTenant.id));
      }
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
  
  // Annotate the rent description when lease renewal or new tenant just changed the rent this month
  let rentDescription = `Rent - ${propertyName}`;
  if (proFormaOutputs?.lastLeaseRenewalWeek === gameRun.currentWeek + 1) {
    const prevRent = proFormaOutputs?.preRenewalRent;
    if (prevRent && prevRent !== monthlyGrossRent) {
      const isNewTenant = proFormaOutputs?.lastRenewalWasNewTenant === true;
      const label = isNewTenant ? 'new tenant' : 'lease renewed';
      // Calculate old net rent using same vacancy rate so the diff matches what the player sees
      const vacRate = proFormaOutputs?.monthlyVacancyLoss && monthlyGrossRent > 0
        ? (proFormaOutputs.monthlyVacancyLoss / monthlyGrossRent) * 100
        : (proFormaInputs?.vacancyRate || 5);
      const prevNetRent = Math.round(prevRent * (1 - vacRate / 100));
      const diff = actualRentReceived - prevNetRent;
      rentDescription = `Rent - ${propertyName} (${label}: ${diff > 0 ? '+' : '-'}$${Math.abs(diff).toLocaleString()}/mo)`;
    }
  }
  
  if (actualRentReceived > 0) {
    ledgerEntries.push({
      direction: 'credit',
      category: 'income',
      amount: actualRentReceived,
      description: rentDescription,
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

  const playerProjectedRent = proFormaInputs?.expectedRent || proFormaInputs?.monthlyRent || 0;
  const playerProjectedVacancy = playerProjectedRent * ((proFormaInputs?.vacancyRate || 5) / 100);
  const playerProjectedOpEx = proFormaOutputs?.monthlyOperatingExpenses || monthlyOperatingExpenses;
  const playerProjectedDebt = proFormaOutputs?.monthlyDebtService || proFormaOutputs?.debtServiceMonthly || monthlyDebtService;
  const playerProjectedExpenses = playerProjectedVacancy + playerProjectedOpEx + playerProjectedDebt;
  const actualMonthlyExpenses = scaledVacancyLoss + fixedOperatingExpenses + fixedDebtService;
  const projectedCashFlow = playerProjectedRent - playerProjectedExpenses;
  const actualCashFlow = scaledGrossRent - actualMonthlyExpenses;
  const rentDelta = scaledGrossRent - playerProjectedRent;
  const expenseDelta = actualMonthlyExpenses - playerProjectedExpenses;

  const realityCheckData = proFormaOutputs?.realityCheck;
  const hasMeaningfulDelta = playerProjectedRent > 0 && playerProjectedExpenses > 0 && (
    Math.abs(rentDelta) > playerProjectedRent * 0.05 || Math.abs(expenseDelta) > playerProjectedExpenses * 0.05
  );

  let comparisonExplanation = '';
  if (realityCheckData?.explanation) {
    comparisonExplanation = realityCheckData.explanation;
  } else if (hasMeaningfulDelta) {
    const reasons: string[] = [];
    const fixedIds = proFormaInputs?.fixedIssueIds || [];
    const discoveredIds = proFormaInputs?.discoveredIssueIds || [];
    const skippedIssueCount = discoveredIds.filter((id: string) => !fixedIds.includes(id)).length;

    if (rentDelta < 0) {
      if (skippedIssueCount > 0) {
        reasons.push(`Unfixed issues (${skippedIssueCount}) are reducing what tenants will pay.`);
      }
      const market = (gameRun.marketCondition as string) || 'good';
      if (market === 'terrible' || market === 'poor') {
        reasons.push('Weak market conditions are pushing rents below expectations.');
      } else if (reasons.length === 0) {
        reasons.push('Market rents came in lower than your assumption.');
      }
    } else if (rentDelta > 0) {
      reasons.push('Actual rent is exceeding your pro forma — nice conservative underwriting!');
    }
    if (expenseDelta > 0) {
      if (Math.abs(scaledVacancyLoss - playerProjectedVacancy) > playerProjectedVacancy * 0.1) {
        reasons.push('Vacancy is higher than you projected.');
      }
      if (fixedOperatingExpenses > (playerProjectedOpEx * 1.1)) {
        reasons.push('Operating expenses (maintenance, taxes, insurance) are running above your estimates.');
      }
      if (reasons.length === 0) {
        reasons.push('Total expenses are higher than projected.');
      }
    } else if (expenseDelta < -playerProjectedExpenses * 0.05) {
      reasons.push('Expenses are coming in below your estimates — good margin of safety.');
    }
    comparisonExplanation = reasons.join(' ');
  }

  return {
    weeklyIncome: netWeeklyIncome,
    grossRent: scaledGrossRent,
    totalExpenses: totalWeeklyExpenses,
    vacancyLoss: scaledVacancyLoss,
    vacancyRate: proFormaOutputs?.effectiveVacancyRate || 0,
    curveball: curveball ? {
      id: curveball.id,
      name: curveball.name,
      description: curveball.description,
      cashImpact: cashImpact,
      emoji: curveball.emoji,
      tenantMessage: curveball.tenantMessage,
      fromIssue: curveball.fromIssue,
      issueId: curveball.issueId,
    } : undefined,
    newCash,
    dealId: deal.id,
    principalPaid,
    interestPaid,
    remainingBalance: newLoanBalance,
    proFormaComparison: (hasMeaningfulDelta && playerProjectedRent > 0) ? {
      projectedRent: playerProjectedRent,
      actualRent: scaledGrossRent,
      projectedExpenses: playerProjectedExpenses,
      actualExpenses: actualMonthlyExpenses,
      projectedCashFlow,
      actualCashFlow,
      rentDelta,
      expenseDelta,
      explanation: comparisonExplanation,
      wasOptimistic: actualCashFlow < projectedCashFlow,
      propertyName: property?.name || `Property #${deal.propertyId}`,
    } : undefined,
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
  
  const monthlyInterest = Math.round((loanAmount * (interestRate / 100)) / 12);
  
  const annualTaxes = purchasePrice * 0.015;
  const annualInsurance = purchasePrice * 0.005;
  const monthlyTaxesAndInsurance = Math.round((annualTaxes + annualInsurance) / 12);
  
  const monthlyCarryingCost = monthlyInterest + monthlyTaxesAndInsurance;
  
  if (monthlyCarryingCost <= 0) return currentCash;
  
  const newCash = currentCash - monthlyCarryingCost;
  
  // Create ledger entry only (no cash update - handled by advanceGameWeek)
  await storage.createLedgerEntry({
    gameRunId: gameRun.id,
    direction: 'debit',
    category: 'expense',
    amount: monthlyCarryingCost,
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

  if (gameRun.status === 'won' || gameRun.status === 'lost') {
    throw new Error('Game has already ended');
  }

  const deals = await storage.getDealsByGameRun(gameRunId);
  const rentalPayments: RentalIncomeResult[] = [];
  const completedFlips: FlipSaleResult[] = [];
  const completedRentalRehabs: CompletedRentalRehab[] = [];
  const curveballs: any[] = [];

  // BUG-007 fix: Track running cash in memory, apply single atomic update at end
  let runningCash = gameRun.cash;

  // Get market condition early - needed for lease renewals during rental processing
  const gameMarket = (gameRun.marketCondition as MarketCondition) || 'good';

  // Get all property investigations for this game to check undiscovered issues
  const investigations = await storage.getPropertyInvestigations(gameRunId);

  // Pre-fetch tenants for all active rentals (used for tenant text messages)
  let allTenants: any[] = [];
  try {
    allTenants = await storage.getTenantsByGameRun(gameRunId);
  } catch (err) {
    // Non-critical
  }

  // Process active rental deals - pay weekly income
  // Skip rentals under rehab - no income when tenant is displaced
  for (const deal of deals) {
    if (deal.status === 'active_rental' && !deal.rentalRehabActive) {
      if ((deal.lastIncomePaymentWeek || 0) < gameRun.currentWeek + 1) {
        const property = await storage.getProperty(deal.propertyId);

        const recentCurveballIds = (deal.recentCurveballIds as string[] | null) || [];
        
        // Calculate months active for progressive escalation
        // Each game turn = 1 month, so weeksActive ≈ monthsActive (turns held)
        const firstPaymentWeek = deal.firstIncomePaymentWeek || deal.lastIncomePaymentWeek || gameRun.currentWeek;
        const monthsActive = Math.max(0, (gameRun.currentWeek + 1) - firstPaymentWeek);

        // Use a mutable reference so lease renewal can refresh data before income processing
        let currentDeal = deal;

        const currentTenant = allTenants.find((t: any) => t.dealId === deal.id);
        let tenantLeavingEvent: any = null;
        let newTenantMoveInEvent: any = null;

        // === NEW TENANT MOVE-IN DETECTION ===
        // If tenant's leaseStartWeek matches current week, they just moved in after a vacancy
        // Adjust rent to current market rate (new lease negotiation) and create a move-in event
        if (currentTenant && property && monthsActive > 1) {
          const tenantLeaseStart = currentTenant.leaseStartWeek ?? 0;
          const isNewMoveIn = tenantLeaseStart >= gameRun.currentWeek && tenantLeaseStart > firstPaymentWeek;
          
          if (isNewMoveIn) {
            const outputs = deal.proFormaOutputs as any;
            const inputs = deal.proFormaInputs as any;
            const currentRent = outputs?.monthlyGrossRent || 0;
            
            if (currentRent > 0) {
              // New tenant lease negotiation — rent adjusts to current market conditions
              const marketShifts: Record<string, number> = {
                terrible: -5, poor: -2, neutral: 0, good: 2, excellent: 4,
              };
              const marketPct = marketShifts[gameMarket] || 0;
              const marketRandom = marketPct + (Math.random() * 2 - 1);
              
              // New tenants negotiate based on property condition
              const unfixedCount = getUnfixedIssues(deal, property).length;
              let conditionPct = 0;
              if (unfixedCount >= 3) conditionPct = -(1 + Math.random() * 2);
              else if (unfixedCount >= 1) conditionPct = -(0.5 + Math.random() * 1);
              
              // Cosmetic upgrade bonus
              const cosmeticPct = outputs.cosmeticUpgradeApplied ? (0.5 + Math.random() * 1) : 0;
              
              let totalChangePct = marketRandom + conditionPct + cosmeticPct;
              totalChangePct = Math.max(-6, Math.min(6, totalChangePct));
              
              const activationRent = outputs.activationMonthlyRent || currentRent;
              let newRent = Math.round(currentRent * (1 + totalChangePct / 100));
              const floor = Math.round(activationRent * 0.70);
              const ceiling = Math.round(activationRent * 1.35);
              newRent = Math.max(floor, Math.min(ceiling, newRent));
              
              const rentDiff = newRent - currentRent;
              
              // Recalculate cash flow with new rent
              const vacancyRate = inputs?.vacancyRate || 5;
              const tenantUtilityPenalty = inputs?.utilities ? 0 : 1.92;
              const effectiveVacancyRate = vacancyRate + tenantUtilityPenalty;
              const effectiveRent = newRent * (1 - effectiveVacancyRate / 100);
              const monthlyTaxes = (inputs?.taxesAnnual || 0) / 12;
              const monthlyInsurance = (inputs?.insuranceAnnual || 0) / 12;
              const maintenanceCost = newRent * ((inputs?.maintenancePct || 5) / 100);
              const capExCost = newRent * ((inputs?.capExPct || 8) / 100);
              const utilitiesCost = inputs?.utilities ? (inputs?.utilitiesMonthly || 150) : 0;
              const mgmtCost = inputs?.propertyManagement ? newRent * ((inputs?.propertyManagementPct || 10) / 100) : 0;
              const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
              const debtService = outputs.monthlyDebtService || 0;
              const newCashFlow = effectiveRent - monthlyOpEx - debtService;
              const newWeeklyIncome = calculateWeeklyIncome(newCashFlow);

              // Calculate old cash flow to get the NET income change (what the player actually sees)
              const oldEffectiveRent = currentRent * (1 - effectiveVacancyRate / 100);
              const oldMaintenanceCost = currentRent * ((inputs?.maintenancePct || 5) / 100);
              const oldCapExCost = currentRent * ((inputs?.capExPct || 8) / 100);
              const oldMgmtCost = inputs?.propertyManagement ? currentRent * ((inputs?.propertyManagementPct || 10) / 100) : 0;
              const oldMonthlyOpEx = monthlyTaxes + monthlyInsurance + oldMaintenanceCost + oldCapExCost + utilitiesCost + oldMgmtCost;
              const oldCashFlow = oldEffectiveRent - oldMonthlyOpEx - debtService;
              const netIncomeDiff = Math.round(newCashFlow - oldCashFlow);

              // Net rent after vacancy — this is what appears as the rent line in the ledger
              const newNetRent = Math.round(effectiveRent);
              const oldNetRent = Math.round(oldEffectiveRent);
              const netRentDiff = newNetRent - oldNetRent;
              
              // Update deal with new rent and mark this as a move-in week for rent annotation
              const updatedOutputs = {
                ...outputs,
                monthlyGrossRent: newRent,
                monthlyVacancyLoss: newRent * (effectiveVacancyRate / 100),
                monthlyOperatingExpenses: monthlyOpEx,
                cashFlowMonthly: newCashFlow,
                preRenewalRent: currentRent,
                lastLeaseRenewalWeek: gameRun.currentWeek + 1,
                lastRenewalWasNewTenant: true,
              };
              
              await storage.updateDeal(deal.id, {
                weeklyIncome: newWeeklyIncome,
                proFormaOutputs: updatedOutputs,
              });
              
              // Update tenant lease rent amount
              await storage.updateTenant(currentTenant.id, {
                leaseRentAmount: newRent,
              });
              
              // Re-fetch deal so processRentalIncome uses updated values
              const refreshedDeal = await storage.getDeal(deal.id);
              if (refreshedDeal) currentDeal = refreshedDeal;
              
              // Build the move-in event — use NET income diff (what the player sees in the ledger)
              const tenantName = (currentTenant.name || 'New Tenant').split(' ')[0];
              const propertyName = property.name || `Property #${deal.propertyId}`;
              const netDiffAbs = Math.abs(netIncomeDiff);
              
              if (netIncomeDiff > 0) {
                newTenantMoveInEvent = {
                  id: 'tenant_move_in',
                  name: 'New Tenant Moving In',
                  type: 'positive',
                  trigger: 'rental_monthly',
                  description: `${tenantName} signed a lease at $${newRent.toLocaleString()}/mo — your net income increases +$${netDiffAbs.toLocaleString()}/mo. ${gameMarket === 'good' || gameMarket === 'excellent' ? 'Strong market demand.' : 'Competitive market rate.'}`,
                  emoji: '🔑',
                  color: 'green',
                };
              } else if (netIncomeDiff < 0) {
                newTenantMoveInEvent = {
                  id: 'tenant_move_in',
                  name: 'New Tenant Moving In',
                  type: 'neutral',
                  trigger: 'rental_monthly',
                  description: `${tenantName} signed a lease at $${newRent.toLocaleString()}/mo — your net income decreases -$${netDiffAbs.toLocaleString()}/mo. ${gameMarket === 'terrible' || gameMarket === 'poor' ? 'Soft market conditions.' : 'Negotiated rate based on property condition.'}`,
                  emoji: '🔑',
                  color: 'yellow',
                };
              } else {
                newTenantMoveInEvent = {
                  id: 'tenant_move_in',
                  name: 'New Tenant Moving In',
                  type: 'neutral',
                  trigger: 'rental_monthly',
                  description: `${tenantName} signed a lease at $${newRent.toLocaleString()}/mo (same rate as previous tenant).`,
                  emoji: '🔑',
                  color: 'blue',
                };
              }
              
              curveballs.push(newTenantMoveInEvent);
              
              // Create a ledger entry for the tenant move-in (informational, $0 impact)
              // Show NET rent change (matches the rent line in the ledger) for consistency
              const propName = property.name || `Property #${deal.propertyId}`;
              const tenantFirst = (currentTenant.name || 'New Tenant').split(' ')[0];
              const moveInDesc = netRentDiff !== 0
                ? `${tenantFirst} moved in - new lease at $${newRent.toLocaleString()}/mo (rent ${netRentDiff > 0 ? '+' : '-'}$${Math.abs(netRentDiff).toLocaleString()}/mo) - ${propName}`
                : `${tenantFirst} moved in - lease at $${newRent.toLocaleString()}/mo - ${propName}`;
              
              await storage.createLedgerEntry({
                gameRunId,
                direction: 'credit',
                category: 'income',
                amount: 0,
                description: moveInDesc,
                propertyId: deal.propertyId,
                dealId: deal.id,
                gameWeek: gameRun.currentWeek,
                balanceAfter: runningCash,
              });
            }
          }
        }

        if (property && currentTenant) {
          const unfixedIssueIds = getUnfixedIssues(deal, property);
          const currentSatisfaction = currentTenant.satisfaction ?? 75;

          const allPropertyIssues = getRandomizedPropertyIssues(
            gameRun.id, deal.propertyId,
            property.propertyType || 'house',
            property.conditionTag || 'Fair',
            (property as any).waterSource || 'public'
          );
          const severityWeight: Record<string, number> = { mild: 1, moderate: 2, severe: 4 };
          let newSatisfaction = currentSatisfaction;
          if (unfixedIssueIds.length > 0) {
            let drop = 0;
            for (const issueId of unfixedIssueIds) {
              const issue = allPropertyIssues.find(i => i.id === issueId);
              drop += severityWeight[issue?.severity || 'moderate'] || 2;
            }
            newSatisfaction = Math.max(0, newSatisfaction - Math.min(drop, 12));
          } else {
            newSatisfaction = Math.min(100, newSatisfaction + 5);
          }

          const newWeeksUnhappy = newSatisfaction < 30
            ? (currentTenant.weeksUnhappy ?? 0) + 1
            : Math.max(0, (currentTenant.weeksUnhappy ?? 0) - 1);

          await storage.updateTenant(currentTenant.id, {
            satisfaction: newSatisfaction,
            weeksUnhappy: newWeeksUnhappy,
          });

          currentTenant.satisfaction = newSatisfaction;
          currentTenant.weeksUnhappy = newWeeksUnhappy;

          // === LEASE RENEWAL CHECK (every 6 months) ===
          const leaseStart = currentTenant.leaseStartWeek ?? (deal.firstIncomePaymentWeek || deal.lastIncomePaymentWeek || 0);
          const monthsSinceLeaseStart = (gameRun.currentWeek + 1) - leaseStart;
          const atRenewalPoint = monthsSinceLeaseStart > 0 && monthsSinceLeaseStart % 6 === 0;

          // Very unhappy tenants refuse to renew their lease — forced move-out at lease end.
          // This prevents a chronically miserable tenant from staying indefinitely.
          if (atRenewalPoint && property && newSatisfaction < 25 && newWeeksUnhappy >= 4) {
            const turnoverCost = 500 + Math.floor(Math.random() * 1001);
            const tenantFirstName = (currentTenant.name || 'Tenant').split(' ')[0];
            tenantLeavingEvent = {
              id: 'tenant_nonrenewal',
              name: 'Tenant Did Not Renew',
              type: 'negative',
              trigger: 'rental_monthly',
              cashImpact: -turnoverCost,
              rentMultiplier: 0,
              description: `${tenantFirstName} chose not to renew the lease after ${newWeeksUnhappy} months of unresolved issues. Property vacant for 1 month. Turnover costs: $${turnoverCost.toLocaleString()}.`,
              emoji: '📦',
              color: 'red',
              tenantIssue: true,
            };
          } else if (atRenewalPoint && property) {
            const leaseRenewalResult = await processLeaseRenewal(deal, property, currentTenant, gameMarket, gameRun.currentWeek + 1, unfixedIssueIds);
            if (leaseRenewalResult) {
              curveballs.push(leaseRenewalResult.event);
              // Re-fetch deal so processRentalIncome uses the updated rent from lease renewal
              const refreshedDeal = await storage.getDeal(deal.id);
              if (refreshedDeal) {
                currentDeal = refreshedDeal;
              }
            }
          }

          if (!tenantLeavingEvent && newSatisfaction < 30 && newWeeksUnhappy >= 3 && monthsActive >= 4) {
            // Escalating chance: starts at 4%, climbs ~4%/month of misery, capped higher than before
            // so chronically unhappy tenants don't drag on for years.
            const baseLeaveChance = 4;
            const unhappyBonus = Math.max(0, newWeeksUnhappy - 3) * 4;
            const totalLeaveChance = Math.min(baseLeaveChance + unhappyBonus, 45);

            if (Math.random() * 100 < totalLeaveChance) {
              const turnoverCost = 500 + Math.floor(Math.random() * 1001);
              const tenantFirstName = (currentTenant.name || 'Tenant').split(' ')[0];
              const leaveReasons = [
                'is fed up with ongoing maintenance issues',
                'found a better-maintained place nearby',
                'is tired of dealing with repairs',
                'is concerned about health risks from deferred maintenance',
                'heard about a better property from a neighbor',
              ];
              const reason = leaveReasons[Math.floor(Math.random() * leaveReasons.length)];
              tenantLeavingEvent = {
                id: 'tenant_departure_conditions',
                name: 'Tenant Moving Out',
                type: 'negative',
                trigger: 'rental_monthly',
                cashImpact: -turnoverCost,
                rentMultiplier: 0,
                description: `${tenantFirstName} ${reason}. Property vacant for 1 month. Turnover costs: $${turnoverCost.toLocaleString()}.`,
                emoji: '🚚',
                color: 'red',
                tenantIssue: true,
              };
            }
          }

          if (!tenantLeavingEvent && monthsActive >= 6) {
            const lifeLeaveChance = 0.8;
            if (Math.random() * 100 < lifeLeaveChance) {
              const turnoverCost = 500 + Math.floor(Math.random() * 501);
              const tenantFirstName = (currentTenant.name || 'Tenant').split(' ')[0];
              const lifeSituations = [
                { reason: 'got a job transfer to another city', emoji: '✈️' },
                { reason: 'is buying their own home', emoji: '🏡' },
                { reason: 'is moving in with a partner', emoji: '💑' },
                { reason: 'needs to relocate for family reasons', emoji: '👨‍👩‍👧' },
                { reason: 'is moving closer to work', emoji: '🚗' },
                { reason: 'got into grad school out of state', emoji: '🎓' },
              ];
              const situation = lifeSituations[Math.floor(Math.random() * lifeSituations.length)];
              tenantLeavingEvent = {
                id: 'tenant_departure_life',
                name: 'Tenant Moving Out',
                type: 'negative',
                trigger: 'rental_monthly',
                cashImpact: -turnoverCost,
                rentMultiplier: 0,
                description: `${tenantFirstName} ${situation.reason}. Property vacant for 1 month. Turnover costs: $${turnoverCost.toLocaleString()}.`,
                emoji: situation.emoji,
                color: 'orange',
                tenantIssue: true,
              };
            }
          }
        }

        // Use tenant leaving event as the curveball if one triggered, otherwise roll normal maintenance
        const curveball = tenantLeavingEvent || (property
          ? rollForEnhancedMaintenance(property, deal, recentCurveballIds, monthsActive)
          : rollForCurveball('rental_monthly', undefined, recentCurveballIds));

        if (curveball && curveball.tenantIssue && !curveball.tenantMessage) {
          const eventDef = ENHANCED_MAINTENANCE_EVENTS.find(e => e.id === curveball.id);
          if (eventDef?.tenantMessages) {
            const tenant = allTenants.find((t: any) => t.dealId === deal.id);
            if (tenant) {
              const personality = (tenant.personalityType || 'generic') as keyof typeof eventDef.tenantMessages;
              const messages = eventDef.tenantMessages[personality] || eventDef.tenantMessages.generic;
              if (messages && messages.length > 0) {
                curveball.tenantMessage = messages[Math.floor(Math.random() * messages.length)];
              }
            }
          }
        }

        const result = await processRentalIncome(currentDeal, gameRun, curveball, runningCash);
        runningCash = result.newCash;

        if (currentTenant && result.grossRent > 0 && !isTenantVacant(curveball)) {
          const ethic = (currentTenant.paymentEthic || 'good') as string;
          const lateChance = ethic === 'perfect' ? 0
            : ethic === 'good' ? 3
            : ethic === 'occasional' ? 10
            : ethic === 'chronic' ? 25 : 3;

          if (lateChance > 0 && Math.random() * 100 < lateChance) {
            const latePct = ethic === 'chronic'
              ? 0.15 + Math.random() * 0.20
              : 0.08 + Math.random() * 0.15;
            const lateAmount = Math.round(result.grossRent * latePct);

            if (lateAmount > 0) {
              const propertyObj = await storage.getProperty(deal.propertyId);
              const propName = propertyObj?.name || `Property #${deal.propertyId}`;

              await storage.createLedgerEntry({
                gameRunId: gameRun.id,
                direction: 'debit',
                category: 'expense',
                amount: lateAmount,
                description: `Late rent - ${propName}`,
                propertyId: deal.propertyId,
                dealId: deal.id,
                gameWeek: gameRun.currentWeek,
                balanceAfter: runningCash - lateAmount,
              });

              runningCash -= lateAmount;
              result.newCash = runningCash;
              result.weeklyIncome -= lateAmount;

              const tenantFirst = (currentTenant.name || 'Tenant').split(' ')[0];
              const lateMessages = getLatePaymentMessages(ethic, tenantFirst, lateAmount);
              const lateMsg = lateMessages[Math.floor(Math.random() * lateMessages.length)];

              result.latePayment = {
                amount: lateAmount,
                tenantMessage: lateMsg,
                tenantName: currentTenant.name,
              };
            }
          }
        }

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
        const proFormaInputs = deal.proFormaInputs as any;
        const proFormaOutputs = deal.proFormaOutputs as any;
        
        const walkthroughData = deal.contractorWalkthroughData as ContractorWalkthroughResult | null;
        const allIssues = walkthroughData?.repairItems || [];
        const fixedIssuesThisRound = deal.rentalRehabItems as ContractorWalkthroughItem[] | null;
        const isPurchaseTimeRehab = !fixedIssuesThisRound || fixedIssuesThisRound.length === 0;

        if (isPurchaseTimeRehab && proFormaOutputs?.monthlyGrossRent !== undefined) {
          const currentRent = proFormaOutputs.monthlyGrossRent || 0;
          const evr = proFormaOutputs.effectiveVacancyRate || 5;
          const opEx = proFormaOutputs.monthlyOperatingExpenses || 0;
          const debtSvc = proFormaOutputs.monthlyDebtService || proFormaOutputs.debtServiceMonthly || 0;
          const recomputedCashFlow = currentRent * (1 - evr / 100) - opEx - debtSvc;
          const recomputedIncome = calculateWeeklyIncome(recomputedCashFlow);

          await storage.updateDeal(deal.id, {
            rentalRehabActive: false,
            rentalRehabWeeksRemaining: 0,
            weeklyIncome: Math.max(0, recomputedIncome),
            proFormaOutputs: {
              ...proFormaOutputs,
              postRehabCompleted: true,
              cashFlowMonthly: recomputedCashFlow,
            },
          });

          await storage.createLedgerEntry({
            gameRunId,
            direction: 'credit',
            category: 'income',
            amount: 0,
            balanceAfter: gameRun.cash,
            description: `Pre-tenant rehab complete — ${property?.name || 'Property'} ready for tenants (rent: $${(proFormaOutputs.monthlyGrossRent || 0).toLocaleString()}/mo)`,
            propertyId: deal.propertyId,
            dealId: deal.id,
            gameWeek: gameRun.currentWeek + 1,
          });

          const grossRent = proFormaOutputs.monthlyGrossRent || 0;
          const vacLoss = proFormaOutputs.monthlyVacancyLoss || 0;
          completedRentalRehabs.push({
            dealId: deal.id,
            propertyName: property?.name || 'Property',
            newMonthlyRent: grossRent,
            previousRent: 0,
            newNetRent: Math.round(grossRent - vacLoss),
            previousNetRent: 0,
            fixedCount: 0,
            totalIssueCount: 0,
            repairCompletionFactor: 1.0,
          });
          continue;
        }

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

        // Upgrade rent boost from pending upgrades
        const pendingUpgradeIds = proFormaOutputs?.pendingUpgradeIds || [];
        const upgradeRentBoost = pendingUpgradeIds.reduce((sum: number, upgradeId: string) => {
          const rehabItems = deal.rentalRehabItems as any[];
          const upgradeItem = rehabItems?.find((item: any) => item.id === upgradeId);
          if (upgradeItem?.rentImpactPct) {
            return sum + Math.round(baseMonthlyRent * (upgradeItem.rentImpactPct / 100));
          }
          return sum;
        }, 0);
        
        // Unfixed issues depress rent (1% per unfixed item)
        const unfixedIssues = allIssues.filter(item => !allCompletedIds.includes(item.id));
        const unfixedIssueCount = unfixedIssues.length;
        const unfixedDepressionAmt = unfixedIssues.reduce((sum, _item) => {
          return sum + Math.round(baseMonthlyRent * 0.01);
        }, 0);
        
        // Net rent change: gains from this round's fixes + upgrades minus mild depression (capped at 25% of base)
        const maxIncrease = Math.round(baseMonthlyRent * 0.25);
        const rentIncrease = Math.min(Math.max(0, totalFixedRentIncrease + upgradeRentBoost - unfixedDepressionAmt), maxIncrease);
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
        const capexPct = proFormaInputs?.capExPct || 8;
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

        // Move pending upgrades to completed
        const previousCompletedUpgrades = proFormaOutputs?.completedUpgradeIds || [];
        const newCompletedUpgrades = [...previousCompletedUpgrades, ...pendingUpgradeIds];

        await storage.updateDeal(deal.id, {
          rentalRehabActive: false,
          rentalRehabWeeksRemaining: 0,
          tenantDisplaced: false,
          weeklyIncome: Math.max(0, newWeeklyIncome),
          completedRepairIds: allCompletedIds,
          proFormaOutputs: {
            ...proFormaOutputs,
            monthlyGrossRent: newMonthlyRent,
            activationMonthlyRent: newMonthlyRent,
            monthlyVacancyLoss: newMonthlyVacancyLoss,
            monthlyOperatingExpenses: newMonthlyOperatingExpenses,
            postRehabCompleted: true,
            repairCompletionFactor,
            unfixedIssueCount,
            completedUpgradeIds: newCompletedUpgrades,
            pendingUpgradeIds: [],
            pendingUpgradeCost: 0,
          },
        });

        // Calculate NET rent values (what the player actually sees in the income line)
        const oldVacancyLoss = baseMonthlyRent * (effectiveVacancyRate / 100);
        const newNetRent = Math.round(newMonthlyRent - newMonthlyVacancyLoss);
        const oldNetRent = Math.round(baseMonthlyRent - oldVacancyLoss);
        const netRentIncrease = newNetRent - oldNetRent;

        // Create ledger entry for rehab completion showing NET rent increase (matches income line)
        const partialNote = unfixedIssueCount > 0 
          ? ` (${(fixedIssuesThisRound || []).length}/${allIssuesCount} issues fixed)`
          : '';
        const rentChangePctDisplay = oldNetRent > 0 ? Math.round((netRentIncrease / oldNetRent) * 100) : 0;
        const rentChangeNote = netRentIncrease > 0 
          ? ` Rent +$${netRentIncrease.toLocaleString()}/mo (+${rentChangePctDisplay}%)`
          : netRentIncrease === 0 ? ' Rent unchanged' : '';
        await storage.createLedgerEntry({
          gameRunId,
          direction: 'credit',
          category: 'income',
          amount: 0,
          balanceAfter: gameRun.cash,
          description: `Rental rehab complete - ${property?.name || 'Property'}${partialNote}${rentChangeNote}`,
          propertyId: deal.propertyId,
          dealId: deal.id,
          gameWeek: gameRun.currentWeek + 1,
        });
        
        // Add to completed rehabs for frontend notification (use NET rent for consistency with ledger)
        completedRentalRehabs.push({
          dealId: deal.id,
          propertyName: property?.name || 'Property',
          newMonthlyRent,
          previousRent: baseMonthlyRent,
          newNetRent,
          previousNetRent: oldNetRent,
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
    if (marketChanged) {
      const currentDrift = gameRun.priceDriftPct ?? 0;
      await storage.updateGameRun(gameRunId, {
        cash: runningCash,
        currentWeek: newWeek,
        weeksRemaining: newWeeksRemaining,
        marketCondition: currentMarket,
        lastMarketChangeWeek: newWeek,
        priceDriftPct: computePriceDrift(currentMarket, currentDrift),
      });
    } else {
      await storage.updateGameRun(gameRunId, {
        cash: runningCash,
        currentWeek: newWeek,
        weeksRemaining: newWeeksRemaining,
        marketCondition: currentMarket,
        lastMarketChangeWeek: newWeek,
      });
    }
  } else {
    await storage.updateGameRun(gameRunId, {
      cash: runningCash,
      currentWeek: newWeek,
      weeksRemaining: newWeeksRemaining,
    });
  }

  // Market rent adjustments now happen at lease renewal (every 6 months), not mid-lease
  // Store the current market condition for lease renewal calculations but don't change rent mid-lease

  // Check for passive income milestones
  // Note: weeklyIncome field is a legacy name — it stores monthly net cash flow (see calculateWeeklyIncome)
  let passiveIncomeMilestones: number[] | undefined;
  const PASSIVE_THRESHOLDS = [250, 500, 1000, 1500, 2000, 3000, 5000];
  const refreshedGameRun = await storage.getGameRun(gameRunId);
  if (refreshedGameRun) {
    const refreshedDeals = await storage.getDealsByGameRun(gameRunId);
    const totalMonthlyPassive = refreshedDeals
      .filter(d => d.status === 'active_rental' && !d.rentalRehabActive)
      .reduce((sum, d) => sum + (d.weeklyIncome || 0), 0);

    const alreadyHit = (refreshedGameRun.passiveIncomeMilestonesHit as number[] | null) || [];
    const newlyHit = PASSIVE_THRESHOLDS.filter(
      t => totalMonthlyPassive >= t && !alreadyHit.includes(t)
    );

    if (newlyHit.length > 0) {
      const updatedHit = [...alreadyHit, ...newlyHit];
      await storage.updateGameRun(gameRunId, {
        passiveIncomeMilestonesHit: updatedHit,
      });
      passiveIncomeMilestones = newlyHit;
    }
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
    passiveIncomeMilestones,
  };
}

function isTenantVacant(curveball: any): boolean {
  if (!curveball) return false;
  return curveball.rentMultiplier === 0 ||
    curveball.id === 'tenant_departure_conditions' ||
    curveball.id === 'tenant_departure_life' ||
    curveball.id === 'early_lease_break';
}

function getLatePaymentMessages(ethic: string, firstName: string, amount: number): string[] {
  const amtStr = `$${amount.toLocaleString()}`;
  if (ethic === 'chronic') {
    return [
      `hey sorry rent is short again this month. ${amtStr} short. ill get it to u next month 🙏`,
      `ik ik im late again. im ${amtStr} short rn. working on it`,
      `rent is gonna be short by ${amtStr}. had some stuff come up. sorry`,
      `look i know this is getting old but im short ${amtStr} this month. im trying`,
      `so... rent situation. im ${amtStr} behind. i promise ill catch up`,
    ];
  }
  if (ethic === 'occasional') {
    return [
      `hey heads up - rent is ${amtStr} short this month. car repair wiped me out. so sorry`,
      `hi, really sorry but im going to be ${amtStr} short on rent. unexpected medical bill`,
      `ugh this is embarrassing but im short ${amtStr} on rent this month. wont happen again`,
      `hey, bad month financially. ${amtStr} short on rent. ill make it up next month`,
    ];
  }
  return [
    `hi sorry! rent is going to be ${amtStr} short this month. first time this has happened to me 😅`,
    `hey really sorry about this - im ${amtStr} short on rent. had an emergency expense. wont be a habit`,
    `wanted to let u know rent will be short by ${amtStr}. so embarrassed. ill have it sorted by next month`,
  ];
}

/**
 * Calculate per-turn rental income from monthly cash flow
 * Each game turn = 1 month, so this just rounds the monthly value
 */
export function calculateWeeklyIncome(monthlyCashFlow: number): number {
  return Math.round(monthlyCashFlow);
}

function getMarketRentMultiplier(market: MarketCondition): number {
  const multipliers: Record<MarketCondition, [number, number]> = {
    terrible: [-0.08, -0.04],
    poor: [-0.04, -0.01],
    neutral: [0, 0],
    good: [0.01, 0.04],
    excellent: [0.04, 0.08],
  };
  const [min, max] = multipliers[market];
  if (min === 0 && max === 0) return 1;
  return 1 + min + Math.random() * (max - min);
}

/**
 * Process lease renewal every 6 months
 * Adjusts rent based on market conditions, tenant satisfaction, property condition, and unfixed issues
 * Returns an event object for the curveball system to display
 */
async function processLeaseRenewal(
  deal: Deal,
  property: Property,
  tenant: any,
  market: MarketCondition,
  currentWeek: number,
  unfixedIssueIds: string[]
): Promise<{ event: any } | null> {
  const outputs = deal.proFormaOutputs as any;
  const inputs = deal.proFormaInputs as any;
  if (!outputs?.monthlyGrossRent) return null;

  const currentRent = outputs.monthlyGrossRent;
  const activationRent = outputs.activationMonthlyRent || currentRent;
  const tenantName = (tenant.name || 'Tenant').split(' ')[0];

  // === RENEWAL RENT CALCULATION ===
  // Base: start from current rent (not activation rent)
  let rentChangePct = 0;

  // 1. Market condition adjustment (the biggest factor)
  const marketShifts: Record<string, number> = {
    terrible: -6, poor: -3, neutral: 0, good: 3, excellent: 5,
  };
  const marketPct = marketShifts[market] || 0;
  // Add some randomness within the market band
  const marketRandom = marketPct + (Math.random() * 3 - 1.5);
  rentChangePct += marketRandom;

  // 2. Tenant satisfaction factor — happy tenants accept small increases; unhappy ones demand discounts
  const satisfaction = tenant.satisfaction ?? 75;
  if (satisfaction >= 80) {
    rentChangePct += 1 + Math.random() * 1.5; // Happy tenant, can push rent slightly
  } else if (satisfaction >= 50) {
    // Neutral — no bonus or penalty
  } else if (satisfaction >= 30) {
    rentChangePct -= 1 + Math.random() * 2; // Unhappy, need to offer a discount to retain
  } else {
    rentChangePct -= 3 + Math.random() * 2; // Very unhappy, significant concession needed
  }

  // 3. Property condition — unfixed issues suppress rent growth
  if (unfixedIssueIds.length >= 3) {
    rentChangePct -= 2 + Math.random() * 2;
  } else if (unfixedIssueIds.length >= 1) {
    rentChangePct -= 0.5 + Math.random() * 1;
  }

  // 4. Cosmetic upgrade bonus — renovated properties command more
  if (outputs.cosmeticUpgradeApplied) {
    rentChangePct += 0.5 + Math.random() * 1;
  }

  // Cap the change to reasonable bounds (-8% to +8% per renewal)
  rentChangePct = Math.max(-8, Math.min(8, rentChangePct));

  // Apply hard floor/ceiling relative to activation rent
  let newRent = Math.round(currentRent * (1 + rentChangePct / 100));
  const floor = Math.round(activationRent * 0.70);
  const ceiling = Math.round(activationRent * 1.35);
  newRent = Math.max(floor, Math.min(ceiling, newRent));

  // Recalculate cash flow with new rent
  const vacancyRate = inputs?.vacancyRate || 5;
  const tenantUtilityPenalty = inputs?.utilities ? 0 : 1.92;
  const effectiveVacancyRate = vacancyRate + tenantUtilityPenalty;
  const effectiveRent = newRent * (1 - effectiveVacancyRate / 100);

  const monthlyTaxes = (inputs?.taxesAnnual || 0) / 12;
  const monthlyInsurance = (inputs?.insuranceAnnual || 0) / 12;
  const maintenanceCost = newRent * ((inputs?.maintenancePct || 5) / 100);
  const capExCost = newRent * ((inputs?.capExPct || 8) / 100);
  const utilitiesCost = inputs?.utilities ? (inputs?.utilitiesMonthly || 150) : 0;
  const mgmtCost = inputs?.propertyManagement ? newRent * ((inputs?.propertyManagementPct || 10) / 100) : 0;
  const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
  const debtService = outputs.monthlyDebtService || 0;
  const newCashFlow = effectiveRent - monthlyOpEx - debtService;
  const newWeeklyIncome = calculateWeeklyIncome(newCashFlow);

  const rentDiff = newRent - currentRent;

  // Calculate NET rent values for display (matches what the player sees in the income line)
  const oldEffRent = currentRent * (1 - effectiveVacancyRate / 100);
  const newNetRent = Math.round(effectiveRent);
  const oldNetRent = Math.round(oldEffRent);
  const netDiff = newNetRent - oldNetRent;
  const netDiffAbs = Math.abs(netDiff);

  // Update deal with new rent
  const updatedOutputs = {
    ...outputs,
    monthlyGrossRent: newRent,
    activationMonthlyRent: activationRent,
    monthlyVacancyLoss: newRent * (effectiveVacancyRate / 100),
    monthlyOperatingExpenses: monthlyOpEx,
    cashFlowMonthly: newCashFlow,
    lastLeaseRenewalWeek: currentWeek,
    lastMarketRentAdjustment: market,
    preRenewalRent: currentRent,
    lastRenewalWasNewTenant: false,
  };

  await storage.updateDeal(deal.id, {
    weeklyIncome: newWeeklyIncome,
    proFormaOutputs: updatedOutputs,
  });

  // Update tenant lease tracking
  await storage.updateTenant(tenant.id, {
    leaseStartWeek: currentWeek,
    leaseRentAmount: newRent,
  });

  // Build descriptive event with reasons
  const propertyName = property.name || 'Property';
  let description: string;
  let emoji: string;
  let eventType: string;
  let color: string;
  const reasons: string[] = [];

  if (rentDiff > 0) {
    if (marketPct >= 2) reasons.push('strong market demand');
    if (satisfaction >= 70) reasons.push('happy tenant accepted increase');
    if (outputs.cosmeticUpgradeApplied) reasons.push('recent renovation');
    if (reasons.length === 0) reasons.push('market adjustment');
    description = `${tenantName}'s lease renewed — income ${netDiff >= 0 ? '+' : '-'}$${netDiffAbs.toLocaleString()}/mo. ${reasons.join(', ').replace(/^./, s => s.toUpperCase())}.`;
    emoji = '📈';
    eventType = 'positive';
    color = 'green';
  } else if (rentDiff < 0) {
    if (marketPct <= -2) reasons.push('weak market conditions');
    if (satisfaction < 50) reasons.push('tenant negotiated lower rent');
    if (unfixedIssueIds.length > 0) reasons.push(`${unfixedIssueIds.length} unresolved property issue${unfixedIssueIds.length > 1 ? 's' : ''}`);
    if (reasons.length === 0) reasons.push('market softening');
    description = `${tenantName}'s lease renewed — income -$${netDiffAbs.toLocaleString()}/mo. ${reasons.join(', ').replace(/^./, s => s.toUpperCase())}.`;
    emoji = '📉';
    eventType = 'negative';
    color = 'orange';
  } else {
    description = `${tenantName}'s lease renewed (no change). Stable market and property conditions.`;
    emoji = '📋';
    eventType = 'neutral';
    color = 'blue';
  }


  return {
    event: {
      id: 'lease_renewal',
      name: 'Lease Renewal',
      type: eventType,
      trigger: 'rental_monthly',
      cashImpact: 0,
      rentMultiplier: 1,
      description,
      emoji,
      color,
      tenantIssue: false,
      propertyName,
    },
  };
}

async function applyMarketRentAdjustment(deal: Deal, market: MarketCondition): Promise<void> {
  const outputs = deal.proFormaOutputs as any;
  if (!outputs?.monthlyGrossRent) return;

  const activationRent = outputs.activationMonthlyRent || outputs.monthlyGrossRent;
  const currentRent = outputs.monthlyGrossRent;
  const multiplier = getMarketRentMultiplier(market);
  let newRent = Math.round(activationRent * multiplier);

  const floor = Math.round(activationRent * 0.70);
  const ceiling = Math.round(activationRent * 1.35);
  newRent = Math.max(floor, Math.min(ceiling, newRent));

  if (newRent === currentRent) return;

  const inputs = deal.proFormaInputs as any;
  const vacancyRate = inputs?.vacancyRate || 5;
  const tenantUtilityPenalty = inputs?.utilities ? 0 : 1.92;
  const effectiveVacancyRate = vacancyRate + tenantUtilityPenalty;
  const effectiveRent = newRent * (1 - effectiveVacancyRate / 100);

  const monthlyTaxes = (inputs?.taxesAnnual || 0) / 12;
  const monthlyInsurance = (inputs?.insuranceAnnual || 0) / 12;
  const maintenanceCost = newRent * ((inputs?.maintenancePct || 5) / 100);
  const capExCost = newRent * ((inputs?.capExPct || 8) / 100);
  const utilitiesCost = inputs?.utilities ? (inputs?.utilitiesMonthly || 150) : 0;
  const mgmtCost = inputs?.propertyManagement ? newRent * ((inputs?.propertyManagementPct || 10) / 100) : 0;
  const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
  const debtService = outputs.monthlyDebtService || 0;
  const newCashFlow = effectiveRent - monthlyOpEx - debtService;
  const newWeeklyIncome = calculateWeeklyIncome(newCashFlow);

  const updatedOutputs = {
    ...outputs,
    monthlyGrossRent: newRent,
    activationMonthlyRent: activationRent,
    monthlyVacancyLoss: newRent * (effectiveVacancyRate / 100),
    monthlyOperatingExpenses: monthlyOpEx,
    cashFlowMonthly: newCashFlow,
    lastMarketRentAdjustment: market,
  };

  await storage.updateDeal(deal.id, {
    weeklyIncome: newWeeklyIncome,
    proFormaOutputs: updatedOutputs,
  });
}

export function generateUpgradeItems(
  property: { price: number; conditionTag: string; propertyType?: string },
  marketCondition: MarketCondition,
  completedUpgradeIds: string[],
  seed: number
): Array<{
  id: string;
  name: string;
  severity: 'upgrade';
  originalCost: number;
  contractorCost: number;
  timelineWeeks: number;
  description: string;
  markup: number;
  rentImpactPct: number;
  saleImpactPct: number;
  isUpgrade: true;
  category: string;
  marketCostMultiplier: number;
  marketRentMultiplier: number;
}> {
  const condition = property.conditionTag || 'Fair';
  const upgrades = getAvailableUpgrades(condition, completedUpgradeIds, property.propertyType);

  if (upgrades.length === 0) return [];

  const marketCostMultipliers: Record<MarketCondition, number> = {
    terrible: 0.8,
    poor: 0.9,
    neutral: 1.0,
    good: 1.12,
    excellent: 1.3,
  };
  const marketRentMultipliers: Record<MarketCondition, number> = {
    terrible: 0.7,
    poor: 0.85,
    neutral: 1.0,
    good: 1.1,
    excellent: 1.2,
  };
  const marketCostMult = marketCostMultipliers[marketCondition];
  const marketRentMult = marketRentMultipliers[marketCondition];

  const priceTier = property.price || 200000;
  let priceScale = 1.0;
  if (priceTier >= 750000) priceScale = 1.6;
  else if (priceTier >= 500000) priceScale = 1.35;
  else if (priceTier >= 350000) priceScale = 1.15;
  else if (priceTier < 200000) priceScale = 0.85;

  let state = seed;
  const random = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };

  return upgrades.map(u => {
    const baseCost = Math.round(u.costMin + random() * (u.costMax - u.costMin));
    const contractorCost = Math.round(baseCost * priceScale * marketCostMult);
    const markup = Math.round(((contractorCost / baseCost) - 1) * 100);
    const adjustedRentPct = Math.round(u.rentImpactPct * marketRentMult * 10) / 10;

    return {
      id: u.id,
      name: u.name,
      severity: 'upgrade' as const,
      originalCost: baseCost,
      contractorCost,
      timelineWeeks: u.timelineWeeks,
      description: u.description,
      markup: Math.max(0, markup),
      rentImpactPct: adjustedRentPct,
      saleImpactPct: u.saleImpactPct,
      isUpgrade: true as const,
      category: u.category,
      marketCostMultiplier: marketCostMult,
      marketRentMultiplier: marketRentMult,
    };
  });
}

export async function applyCosmeticUpgrade(
  dealId: number,
  gameRunId: number
): Promise<{ success: boolean; cost: number; rentBoostPct: number; saleBoostPct: number; message: string; contractorDiscount: boolean }> {
  const deal = await storage.getDeal(dealId);
  if (!deal) throw new Error('Deal not found');

  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) throw new Error('Game run not found');

  const rawProperty = await storage.getProperty(deal.propertyId);
  if (!rawProperty) throw new Error('Property not found');
  const property = applyPriceDrift(rawProperty, gameRun.priceDriftPct ?? 0);

  if (deal.gameRunId !== gameRunId) {
    throw new Error('Deal does not belong to this game run');
  }

  const outputs = deal.proFormaOutputs as any;
  if (outputs?.cosmeticUpgradeApplied) {
    throw new Error('Renovation upgrade already applied to this property');
  }

  const isRental = deal.status === 'active_rental';
  const isFlip = deal.status === 'in_rehab' || deal.status === 'ready_to_list';
  if (!isRental && !isFlip) {
    throw new Error('Property must be an active rental or flip to upgrade');
  }

  const market = (gameRun.marketCondition as MarketCondition) || 'neutral';
  const condition = property.conditionTag || 'Fair';

  const conditionMultipliers: Record<string, number> = {
    'Fixer-Upper': 1.6,
    'Fair': 1.2,
    'Good': 1.0,
    'Excellent': 0.8,
  };
  const conditionCostMult = conditionMultipliers[condition] || 1.0;

  const marketCostMultipliers: Record<MarketCondition, number> = {
    terrible: 0.75,
    poor: 0.85,
    neutral: 1.0,
    good: 1.15,
    excellent: 1.35,
  };
  const marketCostMult = marketCostMultipliers[market];

  const priceTier = property.price || 200000;
  let baseCostMin: number, baseCostMax: number;
  if (priceTier < 200000) {
    baseCostMin = 2500; baseCostMax = 6000;
  } else if (priceTier < 350000) {
    baseCostMin = 4000; baseCostMax = 10000;
  } else if (priceTier < 500000) {
    baseCostMin = 6000; baseCostMax = 15000;
  } else if (priceTier < 750000) {
    baseCostMin = 8000; baseCostMax = 22000;
  } else {
    baseCostMin = 12000; baseCostMax = 35000;
  }

  let rawCost = Math.round((baseCostMin + Math.random() * (baseCostMax - baseCostMin)) * conditionCostMult * marketCostMult);

  const allDeals = await storage.getDealsByGameRun(gameRunId);
  const contractorUseCount = allDeals.filter(d =>
    d.contractorWalkthroughCompleted === true
  ).length;

  let contractorDiscount = false;
  let discountPct = 0;
  let discountMessage = '';
  if (contractorUseCount >= 3) {
    const discountChance = contractorUseCount >= 5 ? 0.55 : 0.35;
    if (Math.random() < discountChance) {
      contractorDiscount = true;
      discountPct = contractorUseCount >= 5
        ? 8 + Math.floor(Math.random() * 8)
        : 5 + Math.floor(Math.random() * 6);
      rawCost = Math.round(rawCost * (1 - discountPct / 100));

      const loyaltyMessages = [
        `Your contractor knocked ${discountPct}% off — "You keep bringing me work, I keep the price right."`,
        `Volume discount: −${discountPct}%. Contractor said "You're one of my best clients this year."`,
        `Contractor cut you a deal — ${discountPct}% off. "Appreciate the repeat business."`,
        `${discountPct}% discount. "I got my guys already in the area from your last project, saves me the drive."`,
        `Your contractor took ${discountPct}% off. "Tell you what, since you've been keeping us busy, I'll eat the markup on materials."`,
      ];
      discountMessage = loyaltyMessages[Math.floor(Math.random() * loyaltyMessages.length)];
    }
  }

  const cost = rawCost;

  if (gameRun.cash < cost) {
    throw new Error(`Not enough cash — renovation would cost ~$${cost.toLocaleString()}`);
  }

  const conditionBoostMultipliers: Record<string, number> = {
    'Fixer-Upper': 1.5,
    'Fair': 1.25,
    'Good': 1.0,
    'Excellent': 0.6,
  };
  const conditionBoostMult = conditionBoostMultipliers[condition] || 1.0;

  const costToValueRatio = cost / priceTier;
  const investmentMult = Math.min(1.5, 0.7 + (costToValueRatio * 15));

  const marketSuccessRates: Record<MarketCondition, number> = {
    terrible: 0.40,
    poor: 0.52,
    neutral: 0.65,
    good: 0.78,
    excellent: 0.88,
  };
  let successRate = marketSuccessRates[market];
  if (condition === 'Fixer-Upper' || condition === 'Fair') {
    successRate = Math.min(0.95, successRate + 0.08);
  } else if (condition === 'Excellent') {
    successRate = Math.max(0.25, successRate - 0.12);
  }
  const succeeded = Math.random() < successRate;

  let rentBoostPct = 0;
  let saleBoostPct = 0;
  let message: string;

  const locationType = property.locationType || 'suburban';
  const propertyType = property.propertyType || 'house';

  const rentalRenovationDescriptions = [
    { work: 'Updated kitchen countertops, backsplash, and cabinet hardware', lowPct: 2, highPct: 5, category: 'kitchen' as const },
    { work: 'New flooring throughout — LVP in living areas, tile in bathrooms', lowPct: 2.5, highPct: 6, category: 'interior' as const },
    { work: 'Full bathroom remodel — vanity, fixtures, tile surround', lowPct: 3, highPct: 7, category: 'bathroom' as const },
    { work: 'Interior repaint, new lighting fixtures, and updated outlets', lowPct: 1.5, highPct: 4, category: 'interior' as const },
    { work: 'Kitchen appliance upgrade and fresh interior paint throughout', lowPct: 2, highPct: 5.5, category: 'kitchen' as const },
    { work: 'New water heater, HVAC filter system, and thermostat upgrade', lowPct: 1.5, highPct: 4.5, category: 'systems' as const },
    { work: 'Refinished hardwood floors, crown molding, and fresh trim paint', lowPct: 2, highPct: 5, category: 'interior' as const },
    { work: 'Landscaping overhaul, new front door, exterior power wash', lowPct: 1, highPct: 3.5, category: 'curb' as const },
  ];

  const flipRenovationDescriptions = [
    { work: 'Curb appeal package — new siding accents, shutters, landscaping, and front door', lowPct: 1, highPct: 5, category: 'curb' as const },
    { work: 'Staged interior with modern finishes — quartz counters, brushed nickel fixtures', lowPct: 1.5, highPct: 5.5, category: 'interior' as const },
    { work: 'Open concept touch-up — removed non-load-bearing wall section, added recessed lighting', lowPct: 2, highPct: 6, category: 'interior' as const },
    { work: 'Bathroom and kitchen refresh — new tile, faucets, cabinet refacing', lowPct: 1.5, highPct: 5, category: 'kitchen' as const },
    { work: 'Energy efficiency upgrades — windows, insulation, smart thermostat', lowPct: 1, highPct: 4.5, category: 'systems' as const },
    { work: 'Full repaint interior/exterior, new garage door, updated hardware throughout', lowPct: 1.5, highPct: 5, category: 'curb' as const },
  ];

  type RenoCategory = 'kitchen' | 'bathroom' | 'interior' | 'systems' | 'curb';
  const getResonanceFactor = (cat: RenoCategory, loc: string, propType: string, mkt: MarketCondition): number => {
    let resonance = 1.0;
    if (loc === 'urban') {
      if (cat === 'kitchen' || cat === 'bathroom') resonance *= 1.15;
      else if (cat === 'curb') resonance *= 0.85;
      else if (cat === 'systems') resonance *= 1.08;
    } else {
      if (cat === 'curb') resonance *= 1.18;
      else if (cat === 'kitchen') resonance *= 1.05;
      else if (cat === 'systems') resonance *= 0.92;
    }
    if (propType === 'apartment' || propType === 'condo') {
      if (cat === 'curb') resonance *= 0.7;
      if (cat === 'interior' || cat === 'kitchen') resonance *= 1.1;
    }
    if (propType === 'duplex') {
      if (cat === 'systems') resonance *= 1.12;
    }
    if (priceTier > 500000) {
      if (cat === 'kitchen' || cat === 'bathroom') resonance *= 1.1;
      if (cat === 'systems') resonance *= 0.9;
    } else if (priceTier < 200000) {
      if (cat === 'systems') resonance *= 1.15;
      if (cat === 'interior') resonance *= 0.95;
    }
    if (mkt === 'excellent' || mkt === 'good') {
      if (cat === 'interior' || cat === 'kitchen') resonance *= 1.08;
    } else if (mkt === 'terrible' || mkt === 'poor') {
      if (cat === 'systems') resonance *= 1.1;
      if (cat === 'interior') resonance *= 0.88;
    }
    return resonance;
  };

  if (succeeded) {
    if (isRental) {
      const desc = rentalRenovationDescriptions[Math.floor(Math.random() * rentalRenovationDescriptions.length)];
      const resonance = getResonanceFactor(desc.category, locationType, propertyType, market);
      const baseBoost = desc.lowPct + Math.random() * (desc.highPct - desc.lowPct);
      rentBoostPct = Math.round(baseBoost * conditionBoostMult * investmentMult * resonance * 10) / 10;
      rentBoostPct = Math.max(1, Math.min(15, rentBoostPct));

      const currentRent = outputs.monthlyGrossRent || 0;
      const newRent = Math.round(currentRent * (1 + rentBoostPct / 100));

      const inputs = deal.proFormaInputs as any;
      const vacancyRate = inputs?.vacancyRate || 5;
      const tenantUtilityPenalty = inputs?.utilities ? 0 : 1.92;
      const effectiveVacancyRate = vacancyRate + tenantUtilityPenalty;
      const effectiveRent = newRent * (1 - effectiveVacancyRate / 100);
      const monthlyTaxes = (inputs?.taxesAnnual || 0) / 12;
      const monthlyInsurance = (inputs?.insuranceAnnual || 0) / 12;
      const maintenanceCost = newRent * ((inputs?.maintenancePct || 5) / 100);
      const capExCost = newRent * ((inputs?.capExPct || 8) / 100);
      const utilitiesCost = inputs?.utilities ? (inputs?.utilitiesMonthly || 150) : 0;
      const mgmtCost = inputs?.propertyManagement ? newRent * ((inputs?.propertyManagementPct || 10) / 100) : 0;
      const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
      const debtService = outputs.monthlyDebtService || 0;
      const newCashFlow = effectiveRent - monthlyOpEx - debtService;

      const updatedOutputs = {
        ...outputs,
        monthlyGrossRent: newRent,
        activationMonthlyRent: newRent,
        monthlyVacancyLoss: newRent * (effectiveVacancyRate / 100),
        monthlyOperatingExpenses: monthlyOpEx,
        cashFlowMonthly: newCashFlow,
        cosmeticUpgradeApplied: true,
        cosmeticUpgradeCost: cost,
        cosmeticUpgradeRentBoost: rentBoostPct,
      };
      await storage.updateDeal(deal.id, {
        weeklyIncome: calculateWeeklyIncome(newCashFlow),
        proFormaOutputs: updatedOutputs,
      });
      message = `${desc.work}. Rent increased ${rentBoostPct}% → $${newRent.toLocaleString()}/mo.`;
    } else {
      const desc = flipRenovationDescriptions[Math.floor(Math.random() * flipRenovationDescriptions.length)];
      const resonance = getResonanceFactor(desc.category, locationType, propertyType, market);
      const baseBoost = desc.lowPct + Math.random() * (desc.highPct - desc.lowPct);
      saleBoostPct = Math.round(baseBoost * conditionBoostMult * investmentMult * resonance * 10) / 10;
      saleBoostPct = Math.max(0.5, Math.min(12, saleBoostPct));

      const updatedOutputs = {
        ...outputs,
        cosmeticUpgradeApplied: true,
        cosmeticUpgradeCost: cost,
        cosmeticUpgradeSaleBoost: saleBoostPct,
      };
      await storage.updateDeal(deal.id, {
        proFormaOutputs: updatedOutputs,
      });
      message = `${desc.work}. Estimated sale value boost: +${saleBoostPct}%.`;
    }
  } else {
    const updatedOutputs = {
      ...outputs,
      cosmeticUpgradeApplied: true,
      cosmeticUpgradeCost: cost,
      cosmeticUpgradeRentBoost: 0,
      cosmeticUpgradeSaleBoost: 0,
    };
    await storage.updateDeal(deal.id, {
      proFormaOutputs: updatedOutputs,
    });
    const locationContext = locationType === 'urban' ? 'urban renters' : 'suburban families';
    const failReasons = [
      `Renovation came out fine, but the comps in the area already have similar finishes. Didn't move the needle.`,
      `Contractor finished the work, but ${locationContext} in this neighborhood aren't paying extra for that type of update.`,
      `The updates look good on paper, but ${propertyType === 'condo' || propertyType === 'apartment' ? 'condo buyers' : 'tenants'} in this price range aren't paying a premium for them.`,
      `Work got done, but the material choices didn't match what ${locationType === 'urban' ? 'city' : 'suburban'} renters here are looking for. Wrong style for the area.`,
      `Upgrades completed, but timing's off — with ${market === 'terrible' || market === 'poor' ? 'the market this soft' : 'demand the way it is'}, nobody's paying more right now.`,
      `Renovation finished but the scope didn't resonate — ${locationType === 'urban' ? 'downtown tenants care more about kitchen and bath' : 'out here, curb appeal and yard space matter more'} than what was done.`,
    ];
    message = failReasons[Math.floor(Math.random() * failReasons.length)];
  }

  if (contractorDiscount && discountMessage) {
    message = discountMessage + ' ' + message;
  }

  const currentGameRun = await storage.getGameRun(gameRunId);
  const currentCash = currentGameRun?.cash ?? gameRun.cash;
  const ledgerDesc = succeeded
    ? `🔨 Renovation${contractorDiscount ? ` (−${discountPct}% loyalty)` : ''}${rentBoostPct > 0 ? ` (+${rentBoostPct}% rent)` : ` (+${saleBoostPct}% value)`}`
    : `🔨 Renovation${contractorDiscount ? ` (−${discountPct}% loyalty)` : ''} — no measurable impact`;
  await storage.createLedgerEntriesWithCashUpdate(
    gameRunId,
    [{
      direction: 'debit' as const,
      category: 'expense' as const,
      amount: cost,
      description: ledgerDesc,
      propertyId: deal.propertyId,
      dealId: deal.id,
    }],
    currentCash
  );

  return { success: succeeded, cost, rentBoostPct, saleBoostPct, message, contractorDiscount };
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
  // Get property to access ground truth rent data (apply market drift)
  const rawProperty = await storage.getProperty(deal.propertyId);
  if (!rawProperty) {
    throw new Error('Property not found');
  }
  const property = applyPriceDrift(rawProperty, gameRun.priceDriftPct ?? 0);

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
    
    // Reality factor: Without market study, rent outcomes are uncertain (BAL-008: softened penalties)
    const luckyRoll = Math.random();
    let realityFactor: number;
    if (luckyRoll < 0.30) {
      // 30% chance: Player got lucky - property performs well (92-115%)
      realityFactor = 0.92 + (Math.random() * 0.23);
    } else if (luckyRoll < 0.60) {
      // 30% chance: Property performs okay - slight discount (82-95%)
      realityFactor = 0.82 + (Math.random() * 0.13);
    } else {
      // 40% chance: Property underperforms for no diligence (68-88%)
      realityFactor = 0.68 + (Math.random() * 0.20);
    }
    actualRent = Math.round(conditionBasedRent * realityFactor);
    
    // If they ALSO skipped condition diligence on a property needing work,
    // additional penalty - but still not 100% guaranteed underwater
    if (!didContractorWalkthrough && !didInspection && (property.rehabMin || 0) > 5000) {
      // 70% chance of blindness penalty, 30% chance of no extra penalty (BAL-008)
      if (Math.random() < 0.70) {
        const blindnessPenalty = 0.88 + (Math.random() * 0.10); // 2-12% additional penalty
        actualRent = Math.round(actualRent * blindnessPenalty);
      }
    }
  }

  // Apply penalty for discovered-but-skipped repairs (known issues the player chose not to fix)
  // Applies regardless of market study — real condition impacts rent either way
  const rentalFixedIds = proFormaInputs?.fixedIssueIds || [];
  const rentalAllIssues = property
    ? getRandomizedPropertyIssues(gameRun.id, deal.propertyId, property.propertyType, property.conditionTag, property.waterSource || 'public')
    : [];
  const validFixedIds = rentalFixedIds.filter(id => rentalAllIssues.some(i => i.id === id));
  const rentalSkippedIssues = rentalAllIssues.filter(issue =>
    issue.discoveredBy.some(method => completedDiligence.includes(method)) &&
    !validFixedIds.includes(issue.id)
  );
  if (rentalSkippedIssues.length > 0) {
    const rentPenaltyPct = Math.min(rentalSkippedIssues.length * 0.01, 0.08);
    actualRent = Math.round(actualRent * (1 - rentPenaltyPct));
  }
  // Boost for fixed issues: targeted repairs attract better tenants (+1.5% per fix, max +8%)
  if (validFixedIds.length > 0) {
    const rentBoostPct = Math.min(validFixedIds.length * 0.015, 0.08);
    actualRent = Math.round(actualRent * (1 + rentBoostPct));
  }

  // Renovation rent boost: strategic upgrades increase rent potential
  const rentalSelectedRenovationIds = proFormaInputs?.selectedRenovationIds || [];
  if (rentalSelectedRenovationIds.length > 0) {
    const renovationRentBoostPct = rentalSelectedRenovationIds
      .map((id: string) => PROPERTY_UPGRADES.find(u => u.id === id))
      .filter(Boolean)
      .reduce((sum: number, u: any) => sum + (u.rentImpactPct || 0), 0);
    if (renovationRentBoostPct > 0) {
      actualRent = Math.round(actualRent * (1 + renovationRentBoostPct / 100));
    }
  }
  
  // Diligence bonus for rentals: thorough investors negotiate better leases,
  // screen tenants better, and reduce operating expense surprises
  // 0-1 types = 0%, 2 = +1%, 3 = +2%, 4 = +3% rent premium
  const rentalDiligenceTypes = ['market_study', 'contractor_walkthrough', 'inspection', 'title_search'];
  const rentalDiligenceCount = rentalDiligenceTypes.filter(d => completedDiligence.includes(d)).length;
  if (rentalDiligenceCount >= 2) {
    const diligenceRentBonus = (rentalDiligenceCount - 1) * 0.01; // 2→1%, 3→2%, 4→3%
    actualRent = Math.round(actualRent * (1 + diligenceRentBonus));
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
  const maintenanceCost = actualRent * ((proFormaInputs.maintenancePct || 5) / 100);
  const capExCost = actualRent * ((proFormaInputs.capExPct || 8) / 100);
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
  const monthlyCapex = monthlyGrossRent * ((proFormaInputs?.capExPct || 8) / 100);
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
    monthlyGrossRent,
    activationMonthlyRent: monthlyGrossRent,
    cashFlowMonthly: actualCashFlowMonthly,
    realityAdjustmentMonthly,
  };

  // Get loan details from pro forma for tracking
  const initialLoanBalance = proFormaOutputs?.loanAmount || 0;
  const loanInterestRate = proFormaOutputs?.interestRate || 6.5;
  const loanTermMonths = proFormaOutputs?.loanTermMonths || 360;
  
  const rehabWeeks = proFormaInputs?.rehabWeeks || 0;
  const hasPreTenantRehab = rehabBudget > 0 && rehabWeeks > 0;

  const updatedDeal = await storage.updateDeal(deal.id, {
    status: 'active_rental',
    weeklyIncome: hasPreTenantRehab ? 0 : weeklyIncome,
    lastIncomePaymentWeek: gameRun.currentWeek,
    firstIncomePaymentWeek: gameRun.currentWeek,
    proFormaOutputs: updatedProFormaOutputs,
    purchasePrice: property?.price || 0,
    purchaseWeek: gameRun.currentWeek,
    ...(hasPreTenantRehab ? {
      rentalRehabActive: true,
      rentalRehabWeeksRemaining: rehabWeeks,
    } : {}),
    originalLoanAmount: initialLoanBalance,
    loanInterestRate,
    loanTermMonths,
    currentLoanBalance: initialLoanBalance,
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    refinanceCount: 0,
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
  marketCostMultiplier?: number;   // Market condition cost adjustment (>1 = more expensive)
  marketRentMultiplier?: number;   // Market condition rent boost adjustment (>1 = higher rent potential)
}

function getMarketRenovationMultipliers(condition: MarketCondition, random: () => number): { costMult: number; rentMult: number } {
  switch (condition) {
    case 'excellent':
      return { costMult: 1.15 + random() * 0.20, rentMult: 1.10 + random() * 0.15 };
    case 'good':
      return { costMult: 1.05 + random() * 0.15, rentMult: 1.05 + random() * 0.10 };
    case 'neutral':
      return { costMult: 1.0, rentMult: 1.0 };
    case 'poor':
      return { costMult: 0.85 + random() * 0.10, rentMult: 0.90 + random() * 0.05 };
    case 'terrible':
      return { costMult: 0.75 + random() * 0.15, rentMult: 0.80 + random() * 0.10 };
    default:
      return { costMult: 1.0, rentMult: 1.0 };
  }
}

function getRentImpactForRepair(issueId: string, severity: 'mild' | 'moderate' | 'severe', random: () => number): number {
  const baseImpact = RENT_IMPACT_BY_ISSUE[issueId];
  if (baseImpact !== undefined) {
    const scale = Math.max(1, baseImpact);
    const variance = (random() - 0.5) * scale * 0.6;
    return Math.max(0, Math.round((baseImpact + variance) * 10) / 10);
  }
  const severityDefaults: Record<string, number> = { mild: 1, moderate: 3, severe: 1.5 };
  const fallback = severityDefaults[severity] || 1;
  const variance = (random() - 0.5) * fallback * 0.6;
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
  marketCondition?: string;
  marketCostMultiplier?: number;
  marketRentMultiplier?: number;
  upgradeItems?: any[];
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

  if (deal.status !== 'active_rental' && deal.status !== 'ready_to_list') {
    return { success: false, error: 'Property must be active to inspect' };
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

  const rawProperty = await storage.getProperty(deal.propertyId);
  if (!rawProperty) {
    return { success: false, error: 'Property not found' };
  }
  const property = applyPriceDrift(rawProperty, gameRun.priceDriftPct ?? 0);

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

  // Market condition affects renovation costs and rent potential
  const marketCondition = (gameRun.marketCondition || 'neutral') as MarketCondition;
  const marketRandom = seededRandom(dealId * 3333 + gameRun.currentWeek);
  const marketMults = getMarketRenovationMultipliers(marketCondition, marketRandom);

  // Generate repair items with markup (30-50% higher than original)
  const repairItems: ContractorWalkthroughItem[] = contractorIssues.map((issue, index) => {
    const itemRandom = seededRandom(dealId * 100 + index);
    
    // Original cost would be from due diligence (mid-range)
    const originalCost = Math.round((issue.costRangeMin + issue.costRangeMax) / 2);
    
    // Markup typically 30-50%, with rare exceptions for realism
    const markupChance = itemRandom();
    let markup: number;
    if (markupChance < 0.05) {
      markup = 0;
    } else if (markupChance < 0.15) {
      markup = 15 + itemRandom() * 10;
    } else {
      markup = 30 + itemRandom() * 20;
    }
    
    // Apply market cost multiplier (good/excellent markets = tighter labor = higher costs)
    const contractorCost = Math.round(originalCost * (1 + markup / 100) * marketMults.costMult);
    
    // Rent impact boosted by market rent multiplier (good/excellent = higher demand = rent upside)
    const baseRentImpactPct = getRentImpactForRepair(issue.id, issue.severity, itemRandom);
    const rentImpactPct = Math.round(baseRentImpactPct * marketMults.rentMult * 10) / 10;
    
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
      marketCostMultiplier: Math.round(marketMults.costMult * 100) / 100,
      marketRentMultiplier: Math.round(marketMults.rentMult * 100) / 100,
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

  const completedUpgradeIds = ((deal.proFormaOutputs as any)?.completedUpgradeIds as string[]) || [];
  const upgradeItems = generateUpgradeItems(
    property,
    marketCondition,
    completedUpgradeIds,
    dealId * 7 + gameRun.currentWeek
  );

  const result: ContractorWalkthroughResult = {
    walkthroughFee,
    repairItems,
    totalRepairCost,
    totalOriginalCost,
    averageMarkup,
    foundTreasure,
    treasureAmount,
    marketCondition,
    marketCostMultiplier: Math.round(marketMults.costMult * 100) / 100,
    marketRentMultiplier: Math.round(marketMults.rentMult * 100) / 100,
    upgradeItems,
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
  if (deal.status !== 'active_rental' && deal.status !== 'ready_to_list') {
    return { success: false, error: 'Property must be active to repair' };
  }
  if (!deal.contractorWalkthroughCompleted) {
    return { success: false, error: 'Must complete contractor walkthrough first' };
  }
  if (deal.rentalRehabActive) {
    return { success: false, error: 'Rehab already in progress' };
  }

  // Get walkthrough data
  const walkthroughData = deal.contractorWalkthroughData as ContractorWalkthroughResult | null;

  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) {
    return { success: false, error: 'Game run not found' };
  }

  const rawProperty = await storage.getProperty(deal.propertyId);
  if (!rawProperty) {
    return { success: false, error: 'Property not found' };
  }
  const property = applyPriceDrift(rawProperty, gameRun.priceDriftPct ?? 0);

  // Separate repair IDs from upgrade IDs
  const selectedUpgradeIds = (selectedRepairIds || []).filter(id => id.startsWith('upgrade_'));
  const selectedActualRepairIds = (selectedRepairIds || []).filter(id => !id.startsWith('upgrade_'));

  // Get valid repair IDs from walkthrough data, excluding previously completed repairs
  const previouslyCompletedIds = (deal.completedRepairIds as string[] | null) || [];
  const allRepairItems = walkthroughData?.repairItems || [];
  const availableRepairItems = allRepairItems.filter(
    item => !previouslyCompletedIds.includes(item.id)
  );
  
  const validRepairIds = new Set(availableRepairItems.map(item => item.id));
  
  // Validate selectedActualRepairIds if provided
  if (selectedActualRepairIds.length > 0) {
    const invalidIds = selectedActualRepairIds.filter(id => !validRepairIds.has(id));
    if (invalidIds.length > 0) {
      return { success: false, error: `Invalid repair IDs: ${invalidIds.join(', ')}` };
    }
  }

  // Validate upgrade IDs
  const completedUpgradeIds = ((deal.proFormaOutputs as any)?.completedUpgradeIds as string[]) || [];
  const marketCondition = (gameRun.marketCondition || 'neutral') as MarketCondition;
  const availableUpgrades = generateUpgradeItems(property, marketCondition, completedUpgradeIds, dealId * 7 + gameRun.currentWeek);
  const validUpgradeIds = new Set(availableUpgrades.map(u => u.id));

  if (selectedUpgradeIds.length > 0) {
    const invalidUpgrades = selectedUpgradeIds.filter(id => !validUpgradeIds.has(id));
    if (invalidUpgrades.length > 0) {
      return { success: false, error: `Invalid upgrade IDs: ${invalidUpgrades.join(', ')}` };
    }
  }
  
  // Filter to only selected repairs
  const repairItems = selectedActualRepairIds.length > 0
    ? availableRepairItems.filter(item => selectedActualRepairIds.includes(item.id))
    : (selectedRepairIds === undefined ? availableRepairItems : []);

  const upgradeItems = availableUpgrades.filter(u => selectedUpgradeIds.includes(u.id));
  
  if (repairItems.length === 0 && upgradeItems.length === 0) {
    return { success: false, error: 'No repairs or upgrades selected' };
  }

  // Calculate tenant break fee (1 month of current rent)
  const monthlyRent = deal.weeklyIncome || 0;
  const breakFee = Math.round(monthlyRent);

  // Calculate base rehab cost and timeline from SELECTED items (repairs + upgrades)
  const repairCost = repairItems.reduce((sum, item) => sum + item.contractorCost, 0);
  const upgradeCost = upgradeItems.reduce((sum, item) => sum + item.contractorCost, 0);
  const baseCost = repairCost + upgradeCost;
  
  // Timeline: Use MAX of selected item timelines (work done in parallel where possible)
  const allTimelines = [...repairItems.map(item => item.timelineWeeks), ...upgradeItems.map(u => u.timelineWeeks)];
  const baseWeeks = Math.max(...allTimelines, 1);

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

  // Store upgrade IDs being processed alongside repairs
  const pendingUpgradeIds = upgradeItems.map(u => u.id);
  const outputs = deal.proFormaOutputs as any;
  const updatedOutputs = {
    ...outputs,
    pendingUpgradeIds,
    pendingUpgradeCost: upgradeCost,
  };

  // Update deal to rental rehab state - store only selected repair items + upgrades
  await storage.updateDeal(dealId, {
    rentalRehabActive: true,
    rentalRehabWeeksRemaining: actualWeeks,
    rentalRehabBaseWeeks: baseWeeks,
    rentalRehabCostBase: baseCost,
    rentalRehabCostActual: actualCost,
    rentalRehabVariancePct: Math.round((varianceWeeks / baseWeeks) * 100),
    rentalRehabStartWeek: gameRun.currentWeek,
    rentalRehabItems: [...repairItems, ...upgradeItems],
    tenantDisplaced: true,
    tenantBreakFee: breakFee,
    weeklyIncome: 0, // No rent during rehab (vacant)
    proFormaOutputs: updatedOutputs,
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
