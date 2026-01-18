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
}

// LTV-based financing calculations
// Higher LTV = higher risk = higher interest rate and fees
export const LTV_MIN = 50;
export const LTV_MAX = 90;
export const INTEREST_MIN = 5.0; // At 50% LTV
export const INTEREST_MAX = 12.0; // At 90% LTV

// Curved risk premium formula: interest increases faster at higher LTV
export const getInterestRateFromLTV = (ltv: number): number => {
  const normalizedLTV = Math.max(0, Math.min(1, (ltv - LTV_MIN) / (LTV_MAX - LTV_MIN)));
  const curvedFactor = Math.pow(normalizedLTV, 1.3);
  return INTEREST_MIN + curvedFactor * (INTEREST_MAX - INTEREST_MIN);
};

// Loan origination fees: 1% at 50% LTV, 4% at 90% LTV (linear)
export const getLoanFeesFromLTV = (ltv: number): number => {
  const normalizedLTV = (ltv - LTV_MIN) / (LTV_MAX - LTV_MIN);
  return 1 + normalizedLTV * 3;
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

// Default values with LTV-based financing
// Player still needs to fill in strategy-specific fields
export const defaultProForma: ProFormaInputs = {
  strategy: 'rent',
  expectedRent: null,
  vacancyRate: null,
  taxesAnnual: null,
  insuranceAnnual: null,
  maintenancePct: null,
  capExPct: null,
  utilities: false,
  utilitiesMonthly: null,
  propertyManagement: false,
  propertyManagementPct: null,
  rehabBudget: null,
  rehabWeeks: null,
  contingencyPct: null,
  ltv: DEFAULT_LTV,
  sellingCostsPct: null,
  contractorType: 'cheap',
  financeRehab: false, // Default to not financing rehab
};

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
  property: Property
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
  
  // Derive financing terms from LTV
  const ltv = inputs.ltv;
  const downPaymentPct = getDownPaymentFromLTV(ltv);
  const interestRate = getInterestRateFromLTV(ltv);
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
  const mgmtCost = inputs.propertyManagement ? expectedRent * (propertyManagementPct / 100) : 0;

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
