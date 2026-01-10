import type { Property } from '@shared/schema';

export interface ProFormaInputs {
  strategy: 'rent' | 'flip';
  expectedRent: number;
  vacancyRate: number;
  taxesAnnual: number;
  insuranceAnnual: number;
  maintenancePct: number;
  capExPct: number;
  utilities: boolean;
  utilitiesMonthly: number;
  propertyManagement: boolean;
  propertyManagementPct: number;
  rehabBudget: number;
  rehabWeeks: number;
  contingencyPct: number;
  financingType: 'bank' | 'hard-money';
  interestRate: number;
  downPaymentPct: number;
  loanOriginationPct: number;
  sellingCostsPct: number;
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

export const defaultProForma: ProFormaInputs = {
  strategy: 'rent',
  expectedRent: 1600,
  vacancyRate: 8,
  taxesAnnual: 2400,
  insuranceAnnual: 1200,
  maintenancePct: 8,
  capExPct: 10,
  utilities: false,
  utilitiesMonthly: 150,
  propertyManagement: false,
  propertyManagementPct: 10,
  rehabBudget: 40000,
  rehabWeeks: 8,
  contingencyPct: 10,
  financingType: 'bank',
  interestRate: 6.5,
  downPaymentPct: 25,
  loanOriginationPct: 2,
  sellingCostsPct: 8,
  contractorType: 'cheap',
};

export const calculateProForma = (
  inputs: ProFormaInputs,
  property: Property
): ProFormaOutputs => {
  const loanAmount = property.price * (1 - inputs.downPaymentPct / 100);
  const downPaymentAmount = property.price * (inputs.downPaymentPct / 100);
  const loanOriginationFees = loanAmount * (inputs.loanOriginationPct / 100);

  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = 30 * 12;
  const debtServiceMonthly = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  const effectiveRent = inputs.expectedRent * (1 - inputs.vacancyRate / 100);
  const monthlyTaxes = inputs.taxesAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;
  const maintenanceCost = inputs.expectedRent * (inputs.maintenancePct / 100);
  const capExCost = inputs.expectedRent * (inputs.capExPct / 100);
  const utilitiesCost = inputs.utilities ? inputs.utilitiesMonthly : 0;
  const mgmtCost = inputs.propertyManagement ? inputs.expectedRent * (inputs.propertyManagementPct / 100) : 0;

  const monthlyOpEx = monthlyTaxes + monthlyInsurance + maintenanceCost + capExCost + utilitiesCost + mgmtCost;
  const noiMonthly = effectiveRent - monthlyOpEx;
  const cashFlowMonthly = noiMonthly - debtServiceMonthly;

  const totalCashInvested = downPaymentAmount + loanOriginationFees + inputs.rehabBudget * (1 + inputs.contingencyPct / 100);
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
