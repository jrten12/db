export interface Property {
  id: string;
  name: string;
  price: number;
  sizeSqft: number;
  neighborhood: string;
  rentRange: [number, number];
  arvRange: [number, number];
  conditionTag: 'Excellent' | 'Good' | 'Fair' | 'Fixer-Upper';
  photoUrl: string;
  baseRehabRange: [number, number];
  baseTimelineRange: [number, number];
  offMarketRate: number;
  viabilityProfile: 'viable' | 'rent-mirage' | 'rehab-sinkhole' | 'time-bomb' | 'leverage-trap';
}

export interface ProFormaInputs {
  strategy: 'rent' | 'flip';
  expectedRent: number;
  vacancyRate: number;
  taxesAnnual: number;
  insuranceAnnual: number;
  maintenancePct: number;
  propertyManagement: boolean;
  propertyManagementPct: number;
  rehabBudget: number;
  rehabWeeks: number;
  contingencyPct: number;
  financingType: 'bank' | 'hard-money';
  interestRate: number;
  downPaymentPct: number;
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

export interface GameState {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
  currentProperty: Property | null;
  proForma: ProFormaInputs;
  isProFormaComplete: boolean;
}

export const defaultProForma: ProFormaInputs = {
  strategy: 'rent',
  expectedRent: 1600,
  vacancyRate: 8,
  taxesAnnual: 2400,
  insuranceAnnual: 1200,
  maintenancePct: 15,
  propertyManagement: false,
  propertyManagementPct: 10,
  rehabBudget: 40000,
  rehabWeeks: 8,
  contingencyPct: 10,
  financingType: 'bank',
  interestRate: 5,
  downPaymentPct: 25,
};

export const sampleProperty: Property = {
  id: 'prop-3',
  name: 'Maplewood Fixer-Upper',
  price: 185000,
  sizeSqft: 1450,
  neighborhood: 'Maplewood',
  rentRange: [1400, 1800],
  arvRange: [220000, 260000],
  conditionTag: 'Fixer-Upper',
  photoUrl: '',
  baseRehabRange: [30000, 55000],
  baseTimelineRange: [6, 12],
  offMarketRate: 0.15,
  viabilityProfile: 'viable',
};

export const calculateProForma = (
  inputs: ProFormaInputs,
  property: Property
): ProFormaOutputs => {
  const loanAmount = property.price * (1 - inputs.downPaymentPct / 100);
  const downPaymentAmount = property.price * (inputs.downPaymentPct / 100);
  
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = 30 * 12;
  const debtServiceMonthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  const effectiveRent = inputs.expectedRent * (1 - inputs.vacancyRate / 100);
  const monthlyTaxes = inputs.taxesAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;
  const maintenanceCost = inputs.expectedRent * (inputs.maintenancePct / 100);
  const mgmtCost = inputs.propertyManagement ? inputs.expectedRent * (inputs.propertyManagementPct / 100) : 0;
  
  const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + mgmtCost;
  const noiMonthly = effectiveRent - monthlyOpEx;
  const cashFlowMonthly = noiMonthly - debtServiceMonthly;

  const totalCashInvested = downPaymentAmount + inputs.rehabBudget * (1 + inputs.contingencyPct / 100);
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