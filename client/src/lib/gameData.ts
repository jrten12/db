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
  financingType: 'bank' | 'hard-money';
  interestRate: number | null;
  downPaymentPct: number | null;
  loanOriginationPct: number | null;
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

// Default values with financing pre-set for clean initialization
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
  financingType: 'bank',
  interestRate: 6.5,
  downPaymentPct: 25,
  loanOriginationPct: 1.5,
  sellingCostsPct: null,
  contractorType: 'cheap',
};

// Required fields for rent strategy
export const requiredRentFields: (keyof ProFormaInputs)[] = [
  'expectedRent', 'vacancyRate', 'taxesAnnual', 'insuranceAnnual',
  'maintenancePct', 'capExPct', 'downPaymentPct', 'interestRate'
];

// Required fields for flip strategy
export const requiredFlipFields: (keyof ProFormaInputs)[] = [
  'rehabBudget', 'rehabWeeks', 'contingencyPct', 'downPaymentPct', 
  'interestRate', 'sellingCostsPct'
];

// Check if pro forma is complete (all required fields filled)
export const isProFormaInputsComplete = (inputs: ProFormaInputs): boolean => {
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  return requiredFields.every(field => {
    const value = inputs[field];
    return value !== null && value !== undefined;
  });
};

// Get list of missing required fields
export const getMissingFields = (inputs: ProFormaInputs): string[] => {
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  return requiredFields.filter(field => {
    const value = inputs[field];
    return value === null || value === undefined;
  });
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
  const interestRate = inputs.interestRate ?? 0;
  const downPaymentPct = inputs.downPaymentPct ?? 0;
  const loanOriginationPct = inputs.loanOriginationPct ?? 0;
  const rehabWeeks = inputs.rehabWeeks ?? 4;

  const loanAmount = property.price * (1 - downPaymentPct / 100);
  const downPaymentAmount = property.price * (downPaymentPct / 100);
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
  const rehabWithContingency = inputs.strategy === 'flip' ? rehabBudget * (1 + contingencyPct / 100) : 0;
  const totalCashInvested = downPaymentAmount + closingCosts + loanOriginationFees + flipHoldingCosts + rehabWithContingency;
  
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
