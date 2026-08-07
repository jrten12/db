/**
 * Living market economy helpers for Dealbreak.
 *
 * Builds on the existing 5-state market weather system with:
 * - Soft listing drifts (ask / rent / ARV) tied to current conditions
 * - Market-scaled rent changes at lease renewal / new-tenant move-in (not mid-lease)
 * - Vacancy as a demand signal
 * - Market-correlated refinance appreciation
 * - Slightly tighter exit bands + steadier transitions (dynamic, not chaotic)
 */

import type { MarketCondition } from './schema';
import { MARKET_CONDITIONS } from './schema';

export interface MarketMultipliers {
  min: number;
  max: number;
}

/** Bias in [-1, 1] for continuous pricing effects */
export function getMarketBias(condition: MarketCondition): number {
  switch (condition) {
    case 'terrible':
      return -0.85;
    case 'poor':
      return -0.4;
    case 'neutral':
      return 0;
    case 'good':
      return 0.4;
    case 'excellent':
      return 0.85;
    default:
      return 0;
  }
}

/**
 * Exit / sale multipliers — slightly narrower than the original bands
 * so listing drift + rent growth don't double-count volatility.
 */
export function getMarketMultipliers(condition: MarketCondition): MarketMultipliers {
  switch (condition) {
    case 'terrible':
      return { min: 0.88, max: 0.96 };
    case 'poor':
      return { min: 0.92, max: 1.02 };
    case 'neutral':
      return { min: 0.96, max: 1.04 };
    case 'good':
      return { min: 0.98, max: 1.08 };
    case 'excellent':
      return { min: 1.0, max: 1.12 };
    default:
      return { min: 0.96, max: 1.04 };
  }
}

/**
 * Soft listing fundamentals for browse/underwrite UI and purchase basis.
 * Caps keep a full year of market swings in a realistic band (~±8–10%).
 */
export function getListingAdjustments(condition: MarketCondition): {
  priceMult: number;
  rentMult: number;
  arvMult: number;
} {
  const bias = getMarketBias(condition);
  // Soft but readable: ~±2% ask / ~±3% rent / ~±2.5% ARV at extremes
  return {
    priceMult: clamp(1 + bias * 0.024, 0.9, 1.1),
    rentMult: clamp(1 + bias * 0.035, 0.88, 1.12),
    arvMult: clamp(1 + bias * 0.028, 0.9, 1.1),
  };
}

export interface MarketAdjustedPropertyFields {
  price: number;
  rentMin: number;
  rentMax: number;
  postRehabRentMin: number | null | undefined;
  postRehabRentMax: number | null | undefined;
  arvMin: number;
  arvMax: number;
}

/** Apply soft market drift to catalog listing numbers (does not mutate DB). */
export function applyMarketToListing<T extends MarketAdjustedPropertyFields>(
  property: T,
  condition: MarketCondition | string | null | undefined
): T {
  const market = normalizeMarketCondition(condition);
  const { priceMult, rentMult, arvMult } = getListingAdjustments(market);

  const scale = (n: number, mult: number) => Math.max(1, Math.round(n * mult));

  return {
    ...property,
    price: scale(property.price, priceMult),
    rentMin: scale(property.rentMin, rentMult),
    rentMax: scale(property.rentMax, rentMult),
    postRehabRentMin:
      property.postRehabRentMin != null ? scale(property.postRehabRentMin, rentMult) : property.postRehabRentMin,
    postRehabRentMax:
      property.postRehabRentMax != null ? scale(property.postRehabRentMax, rentMult) : property.postRehabRentMax,
    arvMin: scale(property.arvMin, arvMult),
    arvMax: scale(property.arvMax, arvMult),
  };
}

/** Vacancy points added/removed by market demand (not auctions). */
export function getMarketVacancyAdjustment(condition: MarketCondition): number {
  switch (condition) {
    case 'terrible':
      return 2.5;
    case 'poor':
      return 1.5;
    case 'neutral':
      return 0;
    case 'good':
      return -0.75;
    case 'excellent':
      return -1.5;
    default:
      return 0;
  }
}

/**
 * Annualized market rent growth rate scaled by conditions (~2.8% at neutral).
 * Used as a reference for listing drift / design docs — leased owned rent is
 * locked mid-lease and only renegotiated at renewal or new-tenant move-in.
 */
export function getWeeklyRentGrowthRate(condition: MarketCondition): number {
  const bias = getMarketBias(condition);
  const annual = 0.028 * (1 + bias * 0.55); // ~1.3% terrible → ~4.1% excellent
  return clamp(annual / 52, -0.0005, 0.0012);
}

/**
 * Deterministic refinance / appraisal appreciation, correlated with market.
 * Floor near flat in terrible markets so refi isn't a free money printer while flips crash.
 */
export function calculateMarketAppreciation(params: {
  weeksHeld: number;
  locationType?: string | null;
  marketCondition: MarketCondition | string | null | undefined;
}): number {
  const monthsHeld = Math.floor(params.weeksHeld / 4.33);
  const baseAppreciation = 0.015;
  const timeAppreciation = Math.min(monthsHeld * 0.004, 0.09);
  const locationBonus = params.locationType === 'urban' ? 0.012 : 0;
  const market = normalizeMarketCondition(params.marketCondition);
  const bias = getMarketBias(market);
  // Market factor: terrible ~0.93, neutral 1.0, excellent ~1.06
  const marketFactor = clamp(1 + bias * 0.08, 0.92, 1.07);
  const raw = (1 + baseAppreciation + timeAppreciation + locationBonus) * marketFactor;
  return clamp(raw, 0.94, 1.22);
}

/** Weighted start — slightly friendlier, still allows hard starts. */
export function getRandomStartingMarket(): MarketCondition {
  const rand = Math.random();
  if (rand < 0.06) return 'terrible';
  if (rand < 0.16) return 'poor';
  if (rand < 0.42) return 'neutral';
  if (rand < 0.74) return 'good';
  return 'excellent';
}

/**
 * Gradual Markov transitions biased toward neutral–good stationarity.
 * Crashes exist but are rarer than the prior "volatile boom/bust" table.
 */
export function progressMarketCondition(currentCondition: MarketCondition): MarketCondition {
  const currentIndex = MARKET_CONDITIONS.indexOf(currentCondition);
  const rand = Math.random();

  let newIndex: number;

  switch (currentIndex) {
    case 0: // terrible — usually recovers one step
      newIndex = rand < 0.78 ? 1 : 0;
      break;
    case 1: // poor
      if (rand < 0.58) newIndex = 2;
      else if (rand < 0.82) newIndex = 1;
      else newIndex = 0;
      break;
    case 2: // neutral — slight upward drift
      if (rand < 0.48) newIndex = 3;
      else if (rand < 0.78) newIndex = 2;
      else newIndex = 1;
      break;
    case 3: // good — often stays / dips gently; rare crash
      if (rand < 0.28) newIndex = 4;
      else if (rand < 0.62) newIndex = 3;
      else if (rand < 0.94) newIndex = 2;
      else newIndex = 1; // 6% soft crash
      break;
    case 4: // excellent — gravity toward good, rare deeper drop
      if (rand < 0.48) newIndex = 4;
      else if (rand < 0.88) newIndex = 3;
      else if (rand < 0.97) newIndex = 2;
      else newIndex = 1; // 3% crash to poor
      break;
    default:
      newIndex = 2;
  }

  return MARKET_CONDITIONS[newIndex];
}

/**
 * Market check every ~4 weeks with ±1 week jitter so cadence isn't metronomic.
 * Still forces a first transition by week 16 if the market never moved.
 */
export function shouldMarketChange(
  currentWeek: number,
  lastMarketChangeWeek: number,
  gameRunId = 0
): boolean {
  if (lastMarketChangeWeek === 0 && currentWeek >= 16) return true;

  // Deterministic jitter per run/week bucket keeps tests stable without Math.random on the gate
  const jitter = ((gameRunId * 17 + Math.floor(lastMarketChangeWeek / 4) * 13) % 3) - 1; // -1, 0, or +1
  const interval = 4 + jitter;
  return currentWeek - lastMarketChangeWeek >= interval;
}

export function normalizeMarketCondition(
  condition: MarketCondition | string | null | undefined
): MarketCondition {
  if (condition && (MARKET_CONDITIONS as string[]).includes(condition)) {
    return condition as MarketCondition;
  }
  return 'neutral';
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
