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

  financeRehab: boolean; // Include rehab costs in loan (acquisition + construction loan)

  arvEstimate: number | null; // Player's estimated sale price for flips

  // Rehab issue tracking (optional - for properties with discovered issues)
  discoveredIssueIds?: string[];  // Issue IDs discovered during diligence
  fixedIssueIds?: string[];       // Issue IDs that were fixed during rehab

}

// LTV-based financing calculations
// Higher LTV = higher risk = higher interest rate and fees
// Players CAN go up to 100% LTV but rates climb steeply - it's a trap for undisciplined players
export const LTV_MIN = 50;
export const LTV_MAX = 100;
export const INTEREST_MIN = 5.0; // At 50% LTV
export const INTEREST_MAX = 18.0; // At 100% LTV - punishing rate for max leverage

// Property Management Settings
export const PROPERTY_MANAGEMENT_FEE_PCT = 5; // Fixed 5% of rent revenue when hired

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

// Curved risk premium formula: interest increases exponentially at higher LTV
// Above 90% LTV, rates climb steeply - this is the "leverage trap" zone
export const getInterestRateFromLTV = (ltv: number): number => {
  const normalizedLTV = Math.max(0, Math.min(1, (ltv - LTV_MIN) / (LTV_MAX - LTV_MIN)));
  // Steeper curve above 90% LTV - exponential punishment for extreme leverage
  let curvedFactor: number;
  if (ltv <= 90) {
    // Standard curve for 50-90% LTV range
    curvedFactor = Math.pow(normalizedLTV * (40/50), 1.3); // Maps to ~7.4% at 90% LTV
  } else {
    // Steep exponential climb from 90-100% LTV (the danger zone)
    const dangerNormalized = (ltv - 90) / 10; // 0 at 90%, 1 at 100%
    const baseAt90 = Math.pow(0.8, 1.3); // ~0.73
    curvedFactor = baseAt90 + dangerNormalized * dangerNormalized * (1 - baseAt90) * 2;
  }
  return INTEREST_MIN + Math.min(curvedFactor, 1) * (INTEREST_MAX - INTEREST_MIN);
};

// Dynamic interest rate that considers player's financial situation
// This is the "real" rate that educated investors would see
export interface PlayerFinancials {
  cash: number;
  totalMonthlyDebt: number;
  totalMonthlyIncome: number;
  totalAssetValue: number;
}

export const getInterestRateWithPlayerState = (ltv: number, playerFinancials: PlayerFinancials): number => {
  const baseRate = getInterestRateFromLTV(ltv);
  
  // DTI adjustment: higher debt = higher rate
  const dti = playerFinancials.totalMonthlyIncome > 0 
    ? (playerFinancials.totalMonthlyDebt / playerFinancials.totalMonthlyIncome) * 100 
    : 100;
  const dtiAdjustment = dti > 50 ? (dti - 50) * 0.03 : 0; // +0.03% per point above 50% DTI
  
  // Cash reserves adjustment: more cash = lower rate
  const reserveMonths = playerFinancials.cash / (playerFinancials.totalMonthlyDebt || 1000);
  const reserveAdjustment = reserveMonths > 6 ? -0.5 : (reserveMonths < 3 ? 0.75 : 0);
  
  // Asset coverage adjustment: more assets relative to new debt = lower rate
  const assetCoverage = playerFinancials.totalAssetValue / (playerFinancials.cash || 1);
  const assetAdjustment = assetCoverage > 3 ? -0.25 : (assetCoverage < 1.5 ? 0.5 : 0);
  
  // Final rate with player-state adjustments, bounded to reasonable limits
  return Math.max(4.5, Math.min(22, baseRate + dtiAdjustment + reserveAdjustment + assetAdjustment));
};

// Loan origination fees: 1% at 50% LTV, scaling up to 6% at 100% LTV
// Fees climb steeply above 90% LTV as lenders charge premium for risky loans
export const getLoanFeesFromLTV = (ltv: number): number => {
  if (ltv <= 90) {
    // 1% at 50%, 4% at 90% (linear)
    const normalizedLTV = (ltv - LTV_MIN) / (90 - LTV_MIN);
    return 1 + normalizedLTV * 3;
  } else {
    // 4% at 90%, 6% at 100% (steeper climb)
    const dangerNormalized = (ltv - 90) / 10;
    return 4 + dangerNormalized * 2;
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
  sellingCostsPct: 8,       // 8% for realtor + closing costs
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
  playerFinancials?: PlayerFinancials
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
  const baseRehabBudget = inputs.rehabBudget ?? 0;
  // Fast contractor = 50% higher rehab costs
  const contractorMultiplier = inputs.contractorType === 'fast' ? 1.5 : 1.0;
  const rehabBudget = baseRehabBudget * contractorMultiplier;
  const contingencyPct = inputs.contingencyPct ?? 0;
  const rehabWeeks = inputs.rehabWeeks ?? 4;
  
  // Derive financing terms from LTV, with player-state-aware interest rate when available
  const ltv = inputs.ltv;
  const downPaymentPct = getDownPaymentFromLTV(ltv);
  // Use player-state-aware interest rate if financials provided, otherwise base LTV rate
  const interestRate = playerFinancials 
    ? getInterestRateWithPlayerState(ltv, playerFinancials)
    : getInterestRateFromLTV(ltv);
  const loanOriginationPct = getLoanFeesFromLTV(ltv);

  // For flips with financeRehab enabled, include rehab in the loan (acquisition + construction loan)
  // This allows players to finance both purchase and rehab with one loan
  const rehabWithContingencyForLoan = inputs.strategy === 'flip' && inputs.financeRehab 
    ? rehabBudget * (1 + contingencyPct / 100) 
    : 0;
  const loanBasis = property.price + rehabWithContingencyForLoan;
  
  const loanAmount = loanBasis * (ltv / 100);
  const downPaymentAmount = loanBasis * (1 - ltv / 100);
  const loanOriginationFees = loanAmount * (loanOriginationPct / 100);
  const closingCosts = Math.round(property.price * 0.03);

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = 30 * 12;
  const debtServiceMonthly = monthlyRate > 0 
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : 0;

  const tenantPaysUtilitiesVacancyPenalty = inputs.utilities ? 0 : 1.92;
  const effectiveVacancyRate = vacancyRate + tenantPaysUtilitiesVacancyPenalty;
  const effectiveRent = expectedRent * (1 - effectiveVacancyRate / 100);
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
  // Down payment + Closing costs + Loan fees + Holding costs (flip) + Rehab with contingency (flip)
  // Note: If financeRehab is true, rehab is included in the loan, not paid upfront
  const rehabWithContingency = inputs.strategy === 'flip' ? rehabBudget * (1 + contingencyPct / 100) : 0;
  const rehabCashOutOfPocket = inputs.financeRehab ? 0 : rehabWithContingency;
  const totalCashInvested = downPaymentAmount + closingCosts + loanOriginationFees + flipHoldingCosts + rehabCashOutOfPocket;
  
  const annualNOI = noiMonthly * 12;
  const capRate = (annualNOI / property.price) * 100;
  const cashOnCash = totalCashInvested > 0 ? ((cashFlowMonthly * 12) / totalCashInvested) * 100 : 0;

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
