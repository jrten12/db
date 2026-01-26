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
  ltv: number;
  sellingCostsPct: number | null;
  contractorType: 'cheap' | 'fast';
}

export interface ProFormaOutputs {
  noiMonthly: number;
  cashFlowMonthly: number;
  capRate: number;
  cashOnCash: number;
  debtServiceMonthly: number;
  downPaymentAmount: number;
  loanAmount: number;
  totalCashInvested: number;
}

export const LTV_MIN = 50;
export const LTV_MAX = 100;
export const INTEREST_MIN = 5.0;
export const INTEREST_MAX = 18.0; // Punishing rate for max leverage

// Curved risk premium formula: interest increases exponentially at higher LTV
// Above 90% LTV, rates climb steeply - this is the "leverage trap" zone
export const getInterestRateFromLTV = (ltv: number): number => {
  const normalizedLTV = Math.max(0, Math.min(1, (ltv - LTV_MIN) / (LTV_MAX - LTV_MIN)));
  let curvedFactor: number;
  if (ltv <= 90) {
    curvedFactor = Math.pow(normalizedLTV * (40/50), 1.3);
  } else {
    const dangerNormalized = (ltv - 90) / 10;
    const baseAt90 = Math.pow(0.8, 1.3);
    curvedFactor = baseAt90 + dangerNormalized * dangerNormalized * (1 - baseAt90) * 2;
  }
  return INTEREST_MIN + Math.min(curvedFactor, 1) * (INTEREST_MAX - INTEREST_MIN);
};

// Loan fees climb steeply above 90% LTV
export const getLoanFeesFromLTV = (ltv: number): number => {
  if (ltv <= 90) {
    const normalizedLTV = (ltv - LTV_MIN) / (90 - LTV_MIN);
    return 1 + normalizedLTV * 3;
  } else {
    const dangerNormalized = (ltv - 90) / 10;
    return 4 + dangerNormalized * 2;
  }
};

export const getDownPaymentFromLTV = (ltv: number): number => {
  return 100 - ltv;
};

export const DEFAULT_LTV = 75;

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
};

export const requiredRentFields: (keyof ProFormaInputs)[] = [
  'expectedRent', 'vacancyRate', 'taxesAnnual', 'insuranceAnnual',
  'maintenancePct', 'capExPct'
];

export const requiredFlipFields: (keyof ProFormaInputs)[] = [
  'rehabBudget', 'rehabWeeks', 'contingencyPct', 'sellingCostsPct'
];

export const isProFormaInputsComplete = (inputs: ProFormaInputs): boolean => {
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  return requiredFields.every(field => {
    const value = inputs[field];
    return value !== null && value !== undefined;
  });
};

export const getMissingFields = (inputs: ProFormaInputs): (keyof ProFormaInputs)[] => {
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  return requiredFields.filter(field => {
    const value = inputs[field];
    return value === null || value === undefined;
  });
};

export const calculateRentalOutputs = (
  inputs: ProFormaInputs,
  purchasePrice: number
): ProFormaOutputs | null => {
  if (!isProFormaInputsComplete(inputs)) return null;
  if (inputs.strategy !== 'rent') return null;

  const rent = inputs.expectedRent || 0;
  const vacancy = (inputs.vacancyRate || 0) / 100;
  const effectiveRent = rent * (1 - vacancy);

  const taxesMonthly = (inputs.taxesAnnual || 0) / 12;
  const insuranceMonthly = (inputs.insuranceAnnual || 0) / 12;
  const maintenanceMonthly = rent * ((inputs.maintenancePct || 0) / 100);
  const capExMonthly = rent * ((inputs.capExPct || 0) / 100);
  const utilitiesMonthly = inputs.utilities ? (inputs.utilitiesMonthly || 0) : 0;
  const pmMonthly = inputs.propertyManagement ? rent * ((inputs.propertyManagementPct || 0) / 100) : 0;

  const totalExpenses = taxesMonthly + insuranceMonthly + maintenanceMonthly + capExMonthly + utilitiesMonthly + pmMonthly;
  const noiMonthly = effectiveRent - totalExpenses;

  const ltv = inputs.ltv;
  const downPaymentPct = getDownPaymentFromLTV(ltv) / 100;
  const downPaymentAmount = purchasePrice * downPaymentPct;
  const loanAmount = purchasePrice - downPaymentAmount;

  const interestRate = getInterestRateFromLTV(ltv) / 100;
  const monthlyRate = interestRate / 12;
  const loanTermMonths = 30 * 12;
  const debtServiceMonthly = loanAmount > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
    : 0;

  const loanFees = purchasePrice * (getLoanFeesFromLTV(ltv) / 100);
  const closingCosts = purchasePrice * 0.02;
  const totalCashInvested = downPaymentAmount + loanFees + closingCosts;

  const cashFlowMonthly = noiMonthly - debtServiceMonthly;
  const noiAnnual = noiMonthly * 12;
  const capRate = purchasePrice > 0 ? (noiAnnual / purchasePrice) * 100 : 0;
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
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
