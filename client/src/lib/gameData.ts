import type { Property } from '@shared/schema';

export interface ProFormaInputs {
  strategy: 'rent' | 'flip';
  expectedRent: number | null;
  vacancyRate: number | null;
  taxesAnnual: number | null;
  insuranceAnnual: number | null;
  maintenancePct: number | null;
  capExPct: number | null;
  utilities: boolean;
  utilitiesMonthly: number | null;
  propertyManagement: boolean;
  propertyManagementPct: number | null;
  rehabBudget: number | null;
  rehabWeeks: number | null;
  contingencyPct: number | null;
  ltv: number; // Loan-to-Value 50-90%, drives interest rate and fees
  sellingCostsPct: number | null;
  contractorType: 'cheap' | 'fast';
  finishLevel: 'builder' | 'luxury'; // Finish quality affects costs and property value

  financeRehab: boolean; // Include rehab costs in loan (acquisition + construction loan)

  arvEstimate: number | null; // Player's estimated sale price for flips

  // Rehab issue tracking (optional - for properties with discovered issues)
  discoveredIssueIds?: string[];  // Issue IDs discovered during diligence
  fixedIssueIds?: string[];       // Issue IDs that were fixed during rehab

}

// Finish level multipliers
export const FINISH_LEVEL_CONFIG = {
  builder: {
    label: 'Builder Grade',
    description: 'Laminate counters, basic cabinets, budget appliances, standard fixtures',
    costMultiplier: 1.0,
    rentBoostPct: 0,
    arvBoostPct: 0,
  },
  luxury: {
    label: 'Luxury',
    description: 'Hardwood floors, upgraded fixtures, stone counters, premium appliances',
    costMultiplier: 1.4,
    rentBoostPct: 10,
    arvBoostPct: 8,
  },
} as const;

// LTV-based financing calculations
// Higher LTV = higher risk = higher interest rate and fees
// Players CAN go up to 100% LTV but rates climb steeply - it's a trap for undisciplined players
export const LTV_MIN = 50;
export const LTV_MAX = 100;
export const INTEREST_MIN = 4.0; // At 50% LTV - competitive rate for conservative leverage
export const INTEREST_MAX = 9.5; // At 100% LTV - high but not devastating for max leverage

// Market rate variability - rates fluctuate +/- this amount randomly over time
export const MARKET_RATE_SWING = 0.75; // +/- 0.75% market fluctuation

// Property Management Settings
export const PROPERTY_MANAGEMENT_FEE_PCT = 5; // Fixed 5% of rent revenue when hired

// Rehab budget cap when diligence hasn't been performed (wider range to account for unknowns)
export const UNKNOWN_REHAB_BUDGET_MULTIPLIER = 1.5;

// Time Penalties (in weeks)
export const TIME_PENALTY_SELF_MANAGED = 1; // 1 week penalty if self-managing (no property manager)
export const TIME_PENALTY_TENANT_PAYS_UTILITIES = 2; // 2 weeks to set up tenant-paid utilities

// Calculate total time penalty for a rental deal based on management choices
export const calculateTimePenalty = (inputs: ProFormaInputs): number => {
  if (inputs.strategy !== 'rent') return 0;
  
  let penalty = 0;
  
  // Self-managed (no property manager) = 1 week penalty
  if (!inputs.propertyManagement) {
    penalty += TIME_PENALTY_SELF_MANAGED;
  }
  
  // Tenant pays utilities (landlord NOT paying) = 2 week penalty to set up
  if (!inputs.utilities) {
    penalty += TIME_PENALTY_TENANT_PAYS_UTILITIES;
  }
  
  return penalty;
};

// Generate a pseudo-random market rate adjustment based on week number
// Creates believable rate variability without needing to store state
export const getMarketRateAdjustment = (weekNumber: number): number => {
  // Use week number to create a deterministic but seemingly random adjustment
  // This creates a smooth wave-like pattern with some noise
  const wave1 = Math.sin(weekNumber * 0.3) * 0.4;
  const wave2 = Math.sin(weekNumber * 0.7 + 2) * 0.25;
  const noise = Math.sin(weekNumber * 2.1 + 5) * 0.1;
  return (wave1 + wave2 + noise) * MARKET_RATE_SWING;
};

// Curved risk premium formula: interest increases exponentially at higher LTV
// Above 90% LTV, rates climb steeply - this is the "leverage trap" zone
export const getInterestRateFromLTV = (ltv: number, weekNumber?: number): number => {
  const normalizedLTV = Math.max(0, Math.min(1, (ltv - LTV_MIN) / (LTV_MAX - LTV_MIN)));
  // Steeper curve above 90% LTV - higher rates for extreme leverage
  let curvedFactor: number;
  if (ltv <= 90) {
    // Standard curve for 50-90% LTV range: 4% at 50%, ~6.5% at 90%
    curvedFactor = Math.pow(normalizedLTV * (40/50), 1.2);
  } else {
    // Steep climb from 90-100% LTV (the danger zone): ~6.5% to 12%
    const dangerNormalized = (ltv - 90) / 10; // 0 at 90%, 1 at 100%
    const baseAt90 = Math.pow(0.8, 1.2); // Rate at 90% LTV
    curvedFactor = baseAt90 + dangerNormalized * dangerNormalized * (1 - baseAt90) * 1.5;
  }
  
  const baseRate = INTEREST_MIN + Math.min(curvedFactor, 1) * (INTEREST_MAX - INTEREST_MIN);
  
  // Apply market rate variability if week number provided
  const marketAdjustment = weekNumber !== undefined ? getMarketRateAdjustment(weekNumber) : 0;
  
  return Math.max(INTEREST_MIN - 0.5, baseRate + marketAdjustment);
};

// Dynamic interest rate that considers player's financial situation
// This is the "real" rate that educated investors would see
export interface PlayerFinancials {
  cash: number;
  totalMonthlyDebt: number;
  totalMonthlyIncome: number;
  totalAssetValue: number;
}

export const getInterestRateWithPlayerState = (ltv: number, playerFinancials: PlayerFinancials, weekNumber?: number): number => {
  const baseRate = getInterestRateFromLTV(ltv, weekNumber);
  
  // DTI adjustment: higher debt = higher rate (reduced impact)
  const dti = playerFinancials.totalMonthlyIncome > 0 
    ? (playerFinancials.totalMonthlyDebt / playerFinancials.totalMonthlyIncome) * 100 
    : 50; // Default to 50% DTI if no income (neutral)
  const dtiAdjustment = dti > 50 ? (dti - 50) * 0.02 : (dti < 30 ? -0.25 : 0); // +0.02% per point above 50%, bonus for low DTI
  
  // Cash reserves adjustment: more cash = lower rate (gentler curve)
  const reserveMonths = playerFinancials.cash / (playerFinancials.totalMonthlyDebt || 1000);
  const reserveAdjustment = reserveMonths > 6 ? -0.35 : (reserveMonths < 3 ? 0.5 : 0);
  
  // Asset coverage adjustment: more assets relative to new debt = lower rate
  const assetCoverage = playerFinancials.totalAssetValue / (playerFinancials.cash || 1);
  const assetAdjustment = assetCoverage > 3 ? -0.2 : (assetCoverage < 1.5 ? 0.35 : 0);
  
  // Final rate with player-state adjustments, bounded to reasonable limits
  return Math.max(3.5, Math.min(15, baseRate + dtiAdjustment + reserveAdjustment + assetAdjustment));
};

// Loan origination fees: 1% at 50% LTV, scaling up to 4% at 100% LTV
// Fees climb above 90% LTV as lenders charge premium for risky loans
export const getLoanFeesFromLTV = (ltv: number): number => {
  if (ltv <= 90) {
    // 1% at 50%, 2.5% at 90% (linear)
    const normalizedLTV = (ltv - LTV_MIN) / (90 - LTV_MIN);
    return 1 + normalizedLTV * 1.5;
  } else {
    // 2.5% at 90%, 4% at 100% (steeper climb)
    const dangerNormalized = (ltv - 90) / 10;
    return 2.5 + dangerNormalized * 1.5;
  }
};

// Down payment is simply 100 - LTV
export const getDownPaymentFromLTV = (ltv: number): number => {
  return 100 - ltv;
};

export interface ProFormaOutputs {
  noiMonthly: number;
  cashFlowMonthly: number;
  capRate: number;
  cashOnCash: number;
  debtServiceMonthly: number;
  downPaymentAmount: number;
  loanAmount: number;
  totalCashInvested: number;
  interestRate: number;
  loanTermMonths: number;
  // Flip-specific outputs (only meaningful when strategy is 'flip')
  flipProfit: number;
  flipROI: number;
}

// Default LTV at 75% (25% down payment, ~7.5% interest)
export const DEFAULT_LTV = 75;

// Market-based defaults to prevent silent zeros and accidental failures
// These are reasonable starting points that users can edit
export const MARKET_DEFAULTS = {
  // Rental defaults (conservative, typical market assumptions)
  vacancyRate: 7,           // 7% vacancy (~3.5 weeks/year empty)
  maintenancePct: 8,        // 8% of rent for ongoing repairs
  capExPct: 5,              // 5% of rent for big-ticket replacements
  propertyManagementPct: 8, // 8% if using property manager
  utilitiesMonthly: 150,    // $150/month if landlord pays
  
  // Flip defaults (conservative estimates)
  contingencyPct: 15,       // 15% buffer for surprises
  sellingCostsPct: 5,       // 5% for realtor + closing costs (BAL-006: reduced from 6%)
  rehabWeeks: 8,            // 8 weeks for typical rehab
};

// Default values with LTV-based financing
// All required fields have market-based defaults to prevent silent zeros
export const defaultProForma: ProFormaInputs = {
  strategy: 'rent',
  expectedRent: null, // Must come from market study or player input
  vacancyRate: MARKET_DEFAULTS.vacancyRate,
  taxesAnnual: null, // Property-specific, calculated at ~1.5% of price
  insuranceAnnual: null, // Property-specific, calculated at ~0.5% of price
  maintenancePct: MARKET_DEFAULTS.maintenancePct,
  capExPct: MARKET_DEFAULTS.capExPct,
  utilities: false,
  utilitiesMonthly: MARKET_DEFAULTS.utilitiesMonthly,
  propertyManagement: false,
  propertyManagementPct: MARKET_DEFAULTS.propertyManagementPct,
  rehabBudget: null, // Must come from contractor walkthrough
  rehabWeeks: MARKET_DEFAULTS.rehabWeeks,
  contingencyPct: MARKET_DEFAULTS.contingencyPct,
  ltv: DEFAULT_LTV,
  sellingCostsPct: MARKET_DEFAULTS.sellingCostsPct,
  contractorType: 'cheap',
  finishLevel: 'builder',
  financeRehab: false, // Default to not financing rehab
  arvEstimate: null, // Player's estimated sale price for flips
};

// Helper to get property-specific defaults based on price
export const getPropertyBasedDefaults = (price: number) => ({
  taxesAnnual: Math.round(price * 0.015), // ~1.5% of price
  insuranceAnnual: Math.round(price * 0.005), // ~0.5% of price
});

// Required fields for rent strategy (LTV handles financing automatically)
export const requiredRentFields: (keyof ProFormaInputs)[] = [
  'expectedRent', 'vacancyRate', 'taxesAnnual', 'insuranceAnnual',
  'maintenancePct', 'capExPct'
];

// Required fields for flip strategy
export const requiredFlipFields: (keyof ProFormaInputs)[] = [
  'rehabBudget', 'rehabWeeks', 'contingencyPct', 'sellingCostsPct'
];

// Check if pro forma is complete (all required fields filled with valid values)
export const isProFormaInputsComplete = (inputs: ProFormaInputs): boolean => {
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  const allFieldsFilled = requiredFields.every(field => {
    const value = inputs[field];
    return value !== null && value !== undefined;
  });
  
  if (!allFieldsFilled) return false;
  
  // For rentals, expectedRent must be > 0 (otherwise cash flow calculations break)
  if (inputs.strategy === 'rent' && (inputs.expectedRent === null || inputs.expectedRent <= 0)) {
    return false;
  }
  
  // Key financial fields must be > 0 to be valid
  // Taxes and insurance should always be positive for real properties
  if (inputs.taxesAnnual !== null && inputs.taxesAnnual <= 0) return false;
  if (inputs.insuranceAnnual !== null && inputs.insuranceAnnual <= 0) return false;
  
  // For flips, rehab budget and weeks must be positive
  if (inputs.strategy === 'flip') {
    if (inputs.rehabBudget === null || inputs.rehabBudget <= 0) return false;
    if (inputs.rehabWeeks === null || inputs.rehabWeeks <= 0) return false;
  }
  
  return true;
};

// Get list of missing or invalid required fields
export const getMissingFields = (inputs: ProFormaInputs): string[] => {
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  const missing = requiredFields.filter(field => {
    const value = inputs[field];
    return value === null || value === undefined;
  });
  
  // Also flag fields that are 0 when they should be positive
  const invalid: string[] = [];
  if (inputs.strategy === 'rent' && inputs.expectedRent !== null && inputs.expectedRent <= 0) {
    invalid.push('expectedRent');
  }
  if (inputs.taxesAnnual !== null && inputs.taxesAnnual <= 0 && !missing.includes('taxesAnnual')) {
    invalid.push('taxesAnnual');
  }
  if (inputs.insuranceAnnual !== null && inputs.insuranceAnnual <= 0 && !missing.includes('insuranceAnnual')) {
    invalid.push('insuranceAnnual');
  }
  if (inputs.strategy === 'flip') {
    if (inputs.rehabBudget !== null && inputs.rehabBudget <= 0 && !missing.includes('rehabBudget')) {
      invalid.push('rehabBudget');
    }
    if (inputs.rehabWeeks !== null && inputs.rehabWeeks <= 0 && !missing.includes('rehabWeeks')) {
      invalid.push('rehabWeeks');
    }
  }
  
  return [...missing, ...invalid];
};

export const calculateProForma = (
  inputs: ProFormaInputs,
  property: Property,
  playerFinancials?: PlayerFinancials,
  weekNumber?: number
): ProFormaOutputs => {
  // Use 0 for null values during calculation (validation should prevent incomplete submissions)
  const expectedRent = inputs.expectedRent ?? 0;
  const vacancyRate = inputs.vacancyRate ?? 0;
  const taxesAnnual = inputs.taxesAnnual ?? 0;
  const insuranceAnnual = inputs.insuranceAnnual ?? 0;
  const maintenancePct = inputs.maintenancePct ?? 0;
  const capExPct = inputs.capExPct ?? 0;
  const utilitiesMonthly = inputs.utilitiesMonthly ?? 0;
  const propertyManagementPct = inputs.propertyManagementPct ?? 0;
  // Rehab budget from inputs already includes contractor type cost adjustments
  // (applied by ItemizedRepairsPanel or ContractorWalkthroughModal)
  // Apply finish level multiplier: luxury finishes cost more but boost rent/ARV
  const finishConfig = FINISH_LEVEL_CONFIG[inputs.finishLevel || 'builder'];
  const rawRehabBudget = inputs.rehabBudget ?? 0;
  const rehabBudget = Math.round(rawRehabBudget * finishConfig.costMultiplier);
  const contingencyPct = inputs.contingencyPct ?? 0;
  const rehabWeeks = inputs.rehabWeeks ?? 4;
  
  // Derive financing terms from LTV, with player-state-aware interest rate when available
  // weekNumber allows for market rate variability over time
  const ltv = inputs.ltv;
  const downPaymentPct = getDownPaymentFromLTV(ltv);
  // Use player-state-aware interest rate if financials provided, otherwise base LTV rate
  const baseInterestRate = playerFinancials 
    ? getInterestRateWithPlayerState(ltv, playerFinancials, weekNumber)
    : getInterestRateFromLTV(ltv, weekNumber);
  // Construction loan premium: 1.5% higher rate when financing rehab costs
  const constructionLoanPremium = inputs.financeRehab ? 1.5 : 0;
  const interestRate = baseInterestRate + constructionLoanPremium;
  const loanOriginationPct = getLoanFeesFromLTV(ltv);

  // When financeRehab is enabled, include rehab in the loan (acquisition + construction loan)
  // This allows players to finance both purchase and rehab with one loan
  const rehabWithContingencyForLoan = inputs.financeRehab 
    ? rehabBudget * (1 + contingencyPct / 100) 
    : 0;
  const loanBasis = property.price + rehabWithContingencyForLoan;
  
  const loanAmount = loanBasis * (ltv / 100);
  const downPaymentAmount = loanBasis * (1 - ltv / 100);
  const loanOriginationFees = loanAmount * (loanOriginationPct / 100);
  const closingCosts = Math.round(property.price * 0.025);

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = 30 * 12;
  const debtServiceMonthly = monthlyRate > 0 
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : 0;

  // Apply luxury finish rent boost (luxury upgrades command higher rents)
  const rentWithFinishBoost = rehabBudget > 0 
    ? expectedRent * (1 + finishConfig.rentBoostPct / 100) 
    : expectedRent;
  const tenantPaysUtilitiesVacancyPenalty = inputs.utilities ? 0 : 1.92;
  const effectiveVacancyRate = vacancyRate + tenantPaysUtilitiesVacancyPenalty;
  const effectiveRent = rentWithFinishBoost * (1 - effectiveVacancyRate / 100);
  const monthlyTaxes = taxesAnnual / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const maintenanceCost = expectedRent * (maintenancePct / 100);
  const capExCost = expectedRent * (capExPct / 100);
  const utilitiesCost = inputs.utilities ? utilitiesMonthly : 0;
  const FIXED_PM_FEE_PCT = 5; // Property management is always 5% of rent when hired
  const mgmtCost = inputs.propertyManagement ? expectedRent * (FIXED_PM_FEE_PCT / 100) : 0;

  const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
  const noiMonthly = effectiveRent - monthlyOpEx;
  const cashFlowMonthly = noiMonthly - debtServiceMonthly;

  // Calculate holding costs for flips (interest + taxes + insurance during rehab)
  const holdingCostPerWeek = Math.round((property.price * (interestRate / 100) / 52) + 
    (taxesAnnual / 52) + (insuranceAnnual / 52));
  const flipHoldingCosts = inputs.strategy === 'flip' ? holdingCostPerWeek * rehabWeeks : 0;

  // Total cash invested = all cash out of pocket:
  // Down payment + Closing costs + Loan fees + Holding costs (flip) + Rehab with contingency
  // Note: If financeRehab is true, rehab is included in the loan, not paid upfront
  const rehabWithContingency = rehabBudget * (1 + contingencyPct / 100);
  const rehabCashOutOfPocket = inputs.financeRehab ? 0 : rehabWithContingency;
  const totalCashInvested = downPaymentAmount + closingCosts + loanOriginationFees + flipHoldingCosts + rehabCashOutOfPocket;
  
  const annualNOI = noiMonthly * 12;
  const capRate = (annualNOI / property.price) * 100;
  const cashOnCash = totalCashInvested > 0 ? ((cashFlowMonthly * 12) / totalCashInvested) * 100 : 0;

  // Calculate flip-specific metrics (profit and ROI)
  // These are only meaningful when strategy is 'flip', but we always calculate for consistency
  // Use player's ARV estimate if provided, otherwise use the midpoint of the ARV range
  // Apply luxury finish ARV boost (luxury upgrades increase property value)
  const arvMid = (property.arvMin + property.arvMax) / 2;
  const baseARV = inputs.arvEstimate !== null ? inputs.arvEstimate : arvMid;
  const playerARV = rehabBudget > 0 
    ? Math.round(baseARV * (1 + finishConfig.arvBoostPct / 100))
    : baseARV;
  const sellingCostsPct = inputs.sellingCostsPct ?? 6;
  const sellingCosts = playerARV * (sellingCostsPct / 100);
  // All-in basis includes purchase price, closing costs, and full rehab with contingency
  const allInBasis = property.price + closingCosts + rehabWithContingency;
  const flipProfit = playerARV - allInBasis - flipHoldingCosts - sellingCosts;
  const flipROI = totalCashInvested > 0 ? (flipProfit / totalCashInvested) * 100 : 0;

  return {
    noiMonthly,
    cashFlowMonthly,
    capRate,
    cashOnCash,
    debtServiceMonthly,
    downPaymentAmount,
    loanAmount,
    totalCashInvested,
    interestRate,
    loanTermMonths: numPayments,
    flipProfit,
    flipROI,
    rehabBudgetAdjusted: rehabBudget,
    finishLevelLabel: finishConfig.label,
    rentWithFinishBoost: Math.round(rentWithFinishBoost),
    arvWithFinishBoost: playerARV,
  };
};

export const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absValue);
  return value < 0 ? `-${formatted}` : formatted;
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const convertPropertyToGameProperty = (prop: Property) => {
  return {
    ...prop,
    rentRange: [prop.rentMin, prop.rentMax] as [number, number],
    arvRange: [prop.arvMin, prop.arvMax] as [number, number],
    baseRehabRange: [prop.rehabMin, prop.rehabMax] as [number, number],
    baseTimelineRange: [prop.timelineMin, prop.timelineMax] as [number, number],
  };
};
