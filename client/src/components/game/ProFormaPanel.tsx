import { useState, useMemo, useCallback, useRef } from 'react';
import { ProFormaInputs, ProFormaOutputs, formatCurrency, calculateProForma, isProFormaInputsComplete, getMissingFields, requiredRentFields, requiredFlipFields, LTV_MIN, LTV_MAX, getInterestRateFromLTV, getInterestRateWithPlayerState, getLoanFeesFromLTV, getDownPaymentFromLTV, PROPERTY_MANAGEMENT_FEE_PCT, PlayerFinancials } from '@/lib/gameData';
import { getEffectiveRanges, EffectiveRanges, getRevealedIssues, type PropertyIssue } from '@/lib/propertyIssues';
import { Building2, Landmark, TrendingUp, Clock, AlertTriangle, DollarSign, Percent, Home, Zap, ChevronDown, ChevronUp, HelpCircle, Lock, X, CheckCircle, Edit3, Wallet, ArrowDown } from 'lucide-react';
import { ItemizedRepairsPanel } from './ItemizedRepairsPanel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AssumptionInput, PercentAssumption } from './AssumptionInput';
import { FormulaCanvas, MiniFormula } from './FormulaCanvas';
import { ProFormaEditor } from './ProFormaEditor';
import type { Property } from '@shared/schema';

const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(4);
  }
};

// Helper to safely get numeric value (default to 0 for calculations)
const n = (val: number | null): number => val ?? 0;

// Check if a field has been filled in by the player
const isFilled = (val: number | null | boolean | string): boolean => {
  if (typeof val === 'boolean') return true; // Booleans are always "filled"
  if (typeof val === 'string') return val.trim().length > 0; // Strings are filled if non-empty after trimming
  if (typeof val === 'number') return !isNaN(val); // Numbers must be valid numbers
  return val !== null && val !== undefined;
};

// Generate input class with green glow when filled and touched, amber for untouched
const getInputClass = (filled: boolean, touched: boolean, isRequired: boolean, baseClass: string = '') => {
  const base = `${baseClass} transition-all duration-200`;
  if (filled && touched) {
    // Filled and touched - green glow
    return `${base} border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]`;
  } else if (isRequired && !touched) {
    // Required but not touched - amber border with pulse
    return `${base} border-amber-500/70 shadow-[0_0_8px_rgba(251,191,36,0.4)] animate-pulse`;
  }
  // Default - slate border
  return `${base} border-slate-700`;
};

// Educational term definitions for info popups
const TERM_DEFINITIONS: Record<string, { title: string; description: string; gameImpact: string }> = {
  expectedRent: {
    title: "Expected Monthly Rent",
    description: "What tenants will pay you each month. This is the #1 input that affects your cash flow and returns.",
    gameImpact: "In the game: Market Study reveals the true rent range based on comparable properties. Without it, you're guessing blindly."
  },
  vacancyRate: {
    title: "Vacancy Rate",
    description: "Percentage of time your property sits empty between tenants. Even good landlords have turnover - tenants move, get evicted, or don't renew.",
    gameImpact: "In the game: Urban properties have higher vacancy (7%) due to more options. Suburban areas have lower vacancy (5%). Your assumption vs. reality affects actual cash flow."
  },
  ltv: {
    title: "Loan-to-Value (LTV)",
    description: "How much of the purchase you're financing with a loan. 80% LTV means you put down 20% and borrow 80%. Higher LTV = more leverage but also higher interest rates and risk.",
    gameImpact: "In the game: Higher LTV means less cash upfront, but higher monthly payments and interest. At 90% LTV, you're paying 12% interest. At 50% LTV, only 5%."
  },
  totalCashNeeded: {
    title: "Total Cash Needed",
    description: "Your upfront investment to close this deal: down payment + closing costs + loan fees + (if flipping) rehab costs unless financed.",
    gameImpact: "In the game: This comes directly from your cash reserves. If you don't have enough, you can't do the deal!"
  },
  taxesAnnual: {
    title: "Annual Property Taxes",
    description: "Yearly taxes paid to the county based on assessed value. Usually 1-3% of property value depending on location. Check with the county assessor.",
    gameImpact: "In the game: Taxes are fixed at 1.5% of purchase price. After rehab, the county may reassess higher. This reduces your net operating income."
  },
  insuranceAnnual: {
    title: "Annual Insurance",
    description: "Landlord/investor insurance covering the property and liability. More expensive than regular homeowner's insurance because of rental liability.",
    gameImpact: "In the game: Insurance typically runs 0.5-1% of property value. This is a fixed operating cost that reduces your cash flow."
  },
  maintenancePct: {
    title: "Maintenance Reserve",
    description: "Ongoing repair costs as a percentage of rent. Budget for fixing leaky faucets, painting, minor repairs. Older properties need more maintenance.",
    gameImpact: "In the game: Doing Contractor Walkthrough or Inspection reveals the true condition. Unfixed issues mean 2-3x more frequent repairs and higher costs!"
  },
  capExPct: {
    title: "Capital Expenditures (CapEx)",
    description: "Reserve fund for big-ticket replacements: roof, HVAC, water heater, appliances. Unlike maintenance, CapEx covers major systems that wear out.",
    gameImpact: "In the game: Budget 5-10% of rent. This builds your reserve for inevitable major repairs. Skimping here means surprises later."
  },
  rehabBudget: {
    title: "Rehab Budget",
    description: "Total renovation cost to fix up the property. Includes materials, labor, permits, and unexpected issues.",
    gameImpact: "In the game: Contractor Walkthrough reveals the true cost range. Without it, surprises can blow your budget by 20-50%!"
  },
  rehabWeeks: {
    title: "Rehab Timeline",
    description: "How long the renovation takes. Contractors are almost never early! Every month of rehab costs you carrying costs (loan interest, taxes, etc.).",
    gameImpact: "In the game: Time is money. Longer rehabs eat into your profits. Fast contractors cost more but save time."
  }
};

function InfoTooltip({ term }: { term: keyof typeof TERM_DEFINITIONS }) {
  const def = TERM_DEFINITIONS[term];
  if (!def) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-cyan-400/60 hover:text-cyan-300 transition-colors p-0.5 -m-0.5 rounded-full hover:bg-cyan-500/10" type="button">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 p-4 z-[200]">
        <h4 className="text-cyan-300 font-semibold text-sm mb-2">{def.title}</h4>
        <p className="text-gray-300 text-xs mb-2">{def.description}</p>
        <p className="text-cyan-400/80 text-xs italic border-t border-slate-600 pt-2 mt-2">{def.gameImpact}</p>
      </PopoverContent>
    </Popover>
  );
}

// Field hints for guidance
const FIELD_HINTS: Record<string, string> = {
  expectedRent: "What monthly rent will you charge?",
  vacancyRate: "% of time property is empty",
  taxesAnnual: "Property taxes per year",
  insuranceAnnual: "Insurance cost per year",
  maintenancePct: "% of rent for repairs",
  capExPct: "% of rent for big repairs",
  propertyManagementPct: "% of rent for manager",
  utilitiesMonthly: "Monthly utility costs",
  rehabBudget: "Total renovation cost",
  rehabWeeks: "How long to complete work",
  contingencyPct: "% buffer for surprises",
  sellingCostsPct: "Realtor fees + closing costs",
  downPaymentPct: "% of price you pay upfront",
  interestRate: "Annual loan interest %",
  loanOriginationPct: "Loan fees %",
};


function UnknownValueTooltip({ type, children }: { type: 'rent' | 'rehab' | 'arv' | 'timeline'; children: React.ReactNode }) {
  const tooltips = {
    rent: {
      title: "Rent Unknown",
      explanation: "You don't know what tenants will pay yet. Without a Market Rent Study, any number you pick is just a guess.",
      action: "Complete a Market Rent Study to unlock accurate rent estimates based on comparable properties in the area.",
    },
    rehab: {
      title: "Rehab Cost Unknown", 
      explanation: "You don't know what repairs will cost. Without a Contractor Walkthrough, you could be off by tens of thousands.",
      action: "Complete a Contractor Walkthrough to get accurate repair estimates from a licensed professional.",
    },
    arv: {
      title: "After Repair Value Unknown",
      explanation: "You don't know what the property will be worth after fixing it up. This is critical for flip deals!",
      action: "Complete a Comp Analysis to see what similar renovated homes sold for recently.",
    },
    timeline: {
      title: "Timeline Unknown",
      explanation: "You don't know how long repairs will take. Every extra month costs money in holding costs!",
      action: "Complete a Contractor Walkthrough to get a realistic timeline from a professional.",
    },
  };
  
  const tooltip = tooltips[type];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help touch-manipulation active:opacity-70">{children}</button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-sm bg-slate-800 border-amber-500/50 text-gray-200 text-sm p-4 z-[100]">
        <div className="space-y-2">
          <p className="font-semibold text-amber-400">{tooltip.title}</p>
          <p className="text-gray-300">{tooltip.explanation}</p>
          <p className="text-emerald-400 text-xs mt-2">→ {tooltip.action}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ProFormaPanelProps {
  property: Property & { rentRange: [number, number] };
  inputs: ProFormaInputs;
  onInputsChange: (inputs: ProFormaInputs) => void;
  onCalculate: () => void;
  completedDiligence?: string[];
  playerCash?: number;
  playerFinancials?: PlayerFinancials;
  weekNumber?: number; // Current game week for market rate variability
  onReturnToProperty?: () => void;
  onProceedWithoutDiligence?: () => void;
  skippedDiligence?: boolean;
  touchedFields?: Set<keyof ProFormaInputs>;
  onFieldTouch?: (fieldKey: keyof ProFormaInputs) => void;
}

export function ProFormaPanel({ property, inputs, onInputsChange, onCalculate, completedDiligence = [], playerCash = 75000, playerFinancials, weekNumber = 1, onReturnToProperty, onProceedWithoutDiligence, skippedDiligence = false, touchedFields = new Set(), onFieldTouch }: ProFormaPanelProps) {
  const effectiveRanges = useMemo(() => getEffectiveRanges(
    {
      rentMin: property.rentRange?.[0] ?? property.rentMin ?? 1000,
      rentMax: property.rentRange?.[1] ?? property.rentMax ?? 2000,
      postRehabRentMin: property.postRehabRentMin,
      postRehabRentMax: property.postRehabRentMax,
      arvMin: property.arvMin ?? 150000,
      arvMax: property.arvMax ?? 200000,
      rehabMin: property.rehabMin ?? 10000,
      rehabMax: property.rehabMax ?? 50000,
      timelineMin: property.timelineMin ?? 4,
      timelineMax: property.timelineMax ?? 12,
      price: property.price,
    },
    completedDiligence
  ), [property, completedDiligence]);

  const revealedIssues = useMemo(() => {
    return getRevealedIssues(property.name, completedDiligence);
  }, [property.name, completedDiligence]);

  const [expandedSections, setExpandedSections] = useState({
    foundation: true,
    capital: true,
    operations: true,
    timeline: true,
  });

  // Pro Forma Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Learning Mode State
  const [showFormulas, setShowFormulas] = useState(true);
  const [highlightField, setHighlightField] = useState<string | null>(null);

  const handleChange = <K extends keyof ProFormaInputs>(key: K, value: ProFormaInputs[K]) => {
    onInputsChange({ ...inputs, [key]: value });
    // Mark field as touched
    if (onFieldTouch) {
      onFieldTouch(key);
    }
    // Briefly highlight affected calculations
    if (key === 'expectedRent' || key === 'vacancyRate') {
      setHighlightField('effectiveRent');
      setTimeout(() => setHighlightField(null), 600);
    } else if (key === 'taxesAnnual' || key === 'insuranceAnnual' || key === 'maintenancePct' || key === 'propertyManagement') {
      setHighlightField('opex');
      setTimeout(() => setHighlightField(null), 600);
    }
  };

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  const handleNumberFocus = (key: keyof ProFormaInputs) => {
    setEditingField(key);
    // Show empty string for null values, not "null"
    const val = inputs[key];
    setEditingValue(val === null || val === undefined ? '' : String(val));
  };
  
  const handleNumberChangeFor = (key: keyof ProFormaInputs, rawValue: string) => {
    setEditingValue(rawValue);
    if (rawValue !== '' && rawValue !== '-') {
      const parsed = parseFloat(rawValue);
      if (!isNaN(parsed)) {
        handleChange(key, parsed as ProFormaInputs[typeof key]);
      }
    } else if (rawValue === '') {
      // Allow clearing the field - set to null
      handleChange(key, null as ProFormaInputs[typeof key]);
    }
  };
  
  const handleNumberBlur = (key: keyof ProFormaInputs, min?: number, max?: number) => {
    setEditingField(null);
    // If empty, keep null - don't auto-fill (forces player to provide input)
    if (editingValue === '' || editingValue === '-') {
      handleChange(key, null as ProFormaInputs[typeof key]);
      return;
    }
    const parsed = parseFloat(editingValue);
    if (!isNaN(parsed)) {
      let finalValue = parsed;
      if (min !== undefined && parsed < min) finalValue = min;
      if (max !== undefined && parsed > max) finalValue = max;
      handleChange(key, finalValue as ProFormaInputs[typeof key]);
    }
  };
  
  const getInputValue = (key: keyof ProFormaInputs): string => {
    if (editingField === key) {
      return editingValue;
    }
    const val = inputs[key];
    // Return empty string for null values so placeholder shows
    if (val === null || val === undefined) {
      return '';
    }
    return String(val);
  };

  // Check for risky assumptions (only check if fields are filled)
  const riskyAssumptions = useMemo(() => {
    const risks = [];
    if (isFilled(inputs.vacancyRate) && n(inputs.vacancyRate) < 5) risks.push({ field: 'vacancy', message: 'Vacancy rate under 5% is optimistic', severity: 'high' });
    if (isFilled(inputs.maintenancePct) && n(inputs.maintenancePct) < 5) risks.push({ field: 'maintenance', message: 'Maintenance under 5% is dangerously low', severity: 'high' });
    if (isFilled(inputs.capExPct) && n(inputs.capExPct) < 8) risks.push({ field: 'capex', message: 'CapEx under 8% leaves no buffer for big replacements', severity: 'high' });
    if (isFilled(inputs.contingencyPct) && n(inputs.contingencyPct) < 10) risks.push({ field: 'contingency', message: 'Contingency under 10% leaves no buffer', severity: 'medium' });
    if (isFilled(inputs.sellingCostsPct) && n(inputs.sellingCostsPct) < 7.5 && inputs.strategy === 'flip') risks.push({ field: 'selling', message: 'Selling costs under 7.5% is optimistic', severity: 'medium' });
    // Only warn about rent if player is guessing without market study
    if (isFilled(inputs.expectedRent) && !effectiveRanges.rent.known) {
      risks.push({ field: 'rent', message: 'Guessing rent without market study - high risk', severity: 'high' });
    }
    if (isFilled(inputs.rehabBudget) && n(inputs.rehabBudget) < effectiveRanges.rehab.min * 1.1 && effectiveRanges.rehab.known) {
      risks.push({ field: 'rehab', message: 'Rehab budget at minimum - likely underestimated', severity: 'medium' });
    }
    return risks;
  }, [inputs, effectiveRanges]);

  const closingCosts = Math.round(property.price * 0.03);
  const allInBasis = property.price + closingCosts + n(inputs.rehabBudget) * (1 + n(inputs.contingencyPct) / 100);
  
  const liveOutputs = useMemo(() => {
    return calculateProForma(inputs, property, playerFinancials, weekNumber);
  }, [inputs, property, playerFinancials, weekNumber]);

  const tenantPaysUtilitiesVacancyPenalty = inputs.utilities ? 0 : 1.92;
  const effectiveVacancyRate = n(inputs.vacancyRate) + tenantPaysUtilitiesVacancyPenalty;
  const effectiveRent = n(inputs.expectedRent) * (1 - effectiveVacancyRate / 100);
  const monthlyExpenses = (n(inputs.taxesAnnual) / 12) + (n(inputs.insuranceAnnual) / 12) +
    (n(inputs.expectedRent) * n(inputs.maintenancePct) / 100) +
    (n(inputs.expectedRent) * n(inputs.capExPct) / 100) +
    (inputs.utilities ? n(inputs.utilitiesMonthly) : 0) +
    (inputs.propertyManagement ? n(inputs.expectedRent) * PROPERTY_MANAGEMENT_FEE_PCT / 100 : 0);
  
  const leverageRatio = inputs.ltv / 100;
  const leverageLevel = leverageRatio > 0.85 ? 'high' : leverageRatio > 0.7 ? 'moderate' : 'low';
  
  // Use player-state-aware interest rate if financials available, otherwise fall back to basic LTV rate
  // Include weekNumber for market rate variability
  const defaultFinancials: PlayerFinancials = { cash: playerCash, totalMonthlyDebt: 0, totalMonthlyIncome: 0, totalAssetValue: 0 };
  const baseInterestRate = playerFinancials 
    ? getInterestRateWithPlayerState(inputs.ltv, playerFinancials, weekNumber)
    : getInterestRateFromLTV(inputs.ltv, weekNumber);
  // Construction loan premium: 1.5% higher rate when financing rehab costs
  const constructionLoanPremium = inputs.strategy === 'flip' && inputs.financeRehab ? 1.5 : 0;
  const derivedInterestRate = baseInterestRate + constructionLoanPremium;
  const derivedLoanFeesPct = getLoanFeesFromLTV(inputs.ltv);
  const derivedDownPaymentPct = getDownPaymentFromLTV(inputs.ltv);
  
  const holdingCostPerWeek = Math.round((property.price * (derivedInterestRate / 100) / 52) + 
    (n(inputs.taxesAnnual) / 52) + (n(inputs.insuranceAnnual) / 52));

  const arvMid = (property.arvMin + property.arvMax) / 2;
  const playerARV = inputs.arvEstimate !== null ? inputs.arvEstimate : arvMid;
  const sellingCosts = (n(inputs.sellingCostsPct) / 100) * arvMid;
  
  // Use flipProfit and flipROI directly from liveOutputs (calculated by calculateProForma)
  // This ensures consistency with MetricsPanel and other components
  const flipProfit = liveOutputs.flipProfit;
  const flipROI = liveOutputs.flipROI;

  const isViable = inputs.strategy === 'rent' 
    ? liveOutputs.cashFlowMonthly > 0 
    : flipProfit > 0;
  
  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasAppraisal = completedDiligence.includes('appraisal');
  const hasContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');
  const hasInspection = completedDiligence.includes('inspection');
  const hasDiligenceForIssues = hasContractorWalkthrough || hasInspection;

  const handleSelectedIssuesChange = useCallback((selectedIds: string[]) => {
    const selectedIssues = revealedIssues.filter(i => selectedIds.includes(i.id));
    const totalCostMin = selectedIssues.reduce((sum, i) => {
      const costMult = inputs.contractorType === 'cheap' ? 0.85 : 1.25;
      return sum + Math.round(i.costRangeMin * costMult);
    }, 0);
    const totalCostMax = selectedIssues.reduce((sum, i) => {
      const costMult = inputs.contractorType === 'cheap' ? 0.95 : 1.4;
      return sum + Math.round(i.costRangeMax * costMult);
    }, 0);
    const avgCost = Math.round((totalCostMin + totalCostMax) / 2);
    
    onInputsChange({
      ...inputs,
      fixedIssueIds: selectedIds,
      discoveredIssueIds: revealedIssues.map(i => i.id),
      rehabBudget: avgCost,
    });
  }, [revealedIssues, inputs, onInputsChange]);
  
  const missingDiligence = {
    rent: !hasMarketStudy,
    arv: !hasAppraisal,
    rehab: !hasContractorWalkthrough,
    issues: !hasInspection,
  };
  
  const diligenceRiskLevel = Object.values(missingDiligence).filter(Boolean).length;
  const completedDiligenceCount = completedDiligence.length;
  
  const canShowViability = completedDiligenceCount >= 2 || skippedDiligence;
  const canShowReturns = inputs.strategy === 'rent' ? hasMarketStudy : hasAppraisal;
  const canShowFragility = completedDiligenceCount >= 1;
  
  const fragility = inputs.strategy === 'rent'
    ? (diligenceRiskLevel >= 2 ? 'high' :
       n(inputs.expectedRent) - effectiveRanges.rent.min < 150 ? 'low' : 
       n(inputs.vacancyRate) < 5 ? 'high' : 
       n(inputs.contingencyPct) < 10 ? 'high' : 'moderate')
    : (diligenceRiskLevel >= 2 ? 'high' :
       n(inputs.contingencyPct) < 10 ? 'high' : 
       n(inputs.rehabWeeks) > effectiveRanges.timeline.min * 1.5 ? 'moderate' : 'low');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Check completion status for pro forma inputs
  const isComplete = isProFormaInputsComplete(inputs);
  const missingFields = getMissingFields(inputs);
  const requiredFields = inputs.strategy === 'rent' ? requiredRentFields : requiredFlipFields;
  const filledCount = requiredFields.filter(field => {
    const val = inputs[field as keyof ProFormaInputs];
    return val !== null && val !== undefined;
  }).length;
  const completionPct = Math.round((filledCount / requiredFields.length) * 100);

  // Check if all required fields have been touched by the user
  const untouchedRequiredFields = requiredFields.filter(field => !touchedFields.has(field));
  const allRequiredFieldsTouched = untouchedRequiredFields.length === 0;
  const touchedCount = requiredFields.filter(field => touchedFields.has(field)).length;

  // Pro forma is only complete if all fields are filled AND all required fields have been touched
  const isFullyComplete = isComplete && allRequiredFieldsTouched;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" data-testid="pro-forma-panel">
      <div className="xl:col-span-2 space-y-4">
        {/* COMPLETION PROGRESS BANNER */}
        <div className={`backdrop-blur rounded-xl border p-4 transition-all ${
          isFullyComplete
            ? 'bg-emerald-500/10 border-emerald-500/50'
            : 'bg-slate-900/90 border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isFullyComplete ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <span className={`font-semibold text-sm ${isFullyComplete ? 'text-emerald-400' : 'text-white'}`}>
                {isFullyComplete ? 'Pro Forma Complete!' : 'Interact with All Fields'}
              </span>
            </div>
            <span className={`text-sm font-mono ${isFullyComplete ? 'text-emerald-400' : 'text-gray-400'}`}>
              {touchedCount}/{requiredFields.length} touched
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${isFullyComplete ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.round((touchedCount / requiredFields.length) * 100)}%` }}
            />
          </div>

          {!allRequiredFieldsTouched && (
            <p className="text-amber-400 text-xs mt-2">
              ⚠️ You must interact with each field/slider, even if values are pre-filled. Untouched: {untouchedRequiredFields.slice(0, 3).join(', ')}{untouchedRequiredFields.length > 3 ? ` +${untouchedRequiredFields.length - 3} more` : ''}
            </p>
          )}
        </div>

        {/* FORMULA VIEW TOGGLE */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur rounded-xl border border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-sm">📊 Interactive Pro Forma</h3>
              <p className="text-gray-400 text-xs mt-1">
                Adjust inputs and watch the formulas calculate in real-time
              </p>
            </div>
            <button
              onClick={() => setShowFormulas(!showFormulas)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                showFormulas
                  ? 'bg-blue-500/20 border border-blue-500 text-blue-400'
                  : 'bg-slate-800 border border-slate-700 text-gray-400 hover:border-slate-600'
              }`}
            >
              {showFormulas ? '📐 Hide Formulas' : '📐 Show Formulas'}
            </button>
          </div>
        </div>

        {/* STRATEGY SELECTOR */}
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 p-4" data-testid="strategy-tabs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">{property.name}</h2>
            <span className="text-gray-400 text-sm">{formatCurrency(property.price)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleChange('strategy', 'rent')}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                inputs.strategy === 'rent'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
              }`}
              data-testid="button-strategy-rent"
            >
              <Home className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold text-sm">Rental</div>
                <div className="text-xs opacity-70">Monthly cash flow</div>
              </div>
            </button>
            <button
              onClick={() => handleChange('strategy', 'flip')}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                inputs.strategy === 'flip'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
              }`}
              data-testid="button-strategy-flip"
            >
              <Zap className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold text-sm">Flip</div>
                <div className="text-xs opacity-70">Profit on resale</div>
              </div>
            </button>
          </div>
        </div>

        {/* UNIFIED RISK WARNING - combines risky assumptions and missing diligence */}
        {(riskyAssumptions.length > 0 || diligenceRiskLevel > 0) && (
          <div className={`rounded-xl border p-4 ${
            riskyAssumptions.some(r => r.severity === 'high') || diligenceRiskLevel >= 3 ? 'bg-red-500/10 border-red-500/50' :
            riskyAssumptions.length > 0 || diligenceRiskLevel >= 2 ? 'bg-amber-500/10 border-amber-500/50' :
            'bg-yellow-500/10 border-yellow-500/50'
          }`} data-testid="risk-warning">
            <div className="flex items-start gap-3">
              <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                riskyAssumptions.some(r => r.severity === 'high') || diligenceRiskLevel >= 3 ? 'text-red-400' :
                riskyAssumptions.length > 0 || diligenceRiskLevel >= 2 ? 'text-amber-400' :
                'text-yellow-400'
              }`} />
              <div className="flex-1">
                <h3 className={`font-semibold text-sm ${
                  riskyAssumptions.some(r => r.severity === 'high') || diligenceRiskLevel >= 3 ? 'text-red-400' :
                  riskyAssumptions.length > 0 || diligenceRiskLevel >= 2 ? 'text-amber-400' :
                  'text-yellow-400'
                }`}>
                  ⚠️ Caution: Review Before Committing
                </h3>
                <ul className="mt-2 space-y-1">
                  {riskyAssumptions.map((risk, i) => (
                    <li key={`risk-${i}`} className="text-xs text-gray-300 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${risk.severity === 'high' ? 'bg-red-400' : 'bg-amber-400'}`} />
                      {risk.message}
                    </li>
                  ))}
                  {missingDiligence.rent && inputs.strategy === 'rent' && (
                    <li className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Market Study - rent estimate is speculative
                    </li>
                  )}
                  {missingDiligence.arv && inputs.strategy === 'flip' && (
                    <li className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Comp Analysis - ARV is speculative
                    </li>
                  )}
                  {missingDiligence.rehab && (
                    <li className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Contractor Walkthrough - rehab cost is a guess
                    </li>
                  )}
                  {missingDiligence.issues && (
                    <li className="text-xs text-gray-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Inspection - hidden issues may exist
                    </li>
                  )}
                </ul>
                {riskyAssumptions.length > 0 && (
                  <p className="text-emerald-400 text-xs mt-2">💡 Conservative assumptions protect you from surprises</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* INLINE PRO FORMA - Soft blue theme with sliders and ranges */}
        <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-sky-500/10 backdrop-blur rounded-2xl border-2 border-cyan-500/30 overflow-hidden shadow-2xl shadow-cyan-500/10">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/40">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-cyan-100 text-xl font-bold tracking-wide drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">Your Pro Forma</h3>
                <p className="text-cyan-300/70 text-sm">Enter your assumptions below</p>
              </div>
            </div>

            {/* Inline Editable Inputs with Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inputs.strategy === 'rent' ? (
                <>
                  {/* Expected Rent - with range if market study done */}
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)] flex items-center gap-2">
                      Expected Rent
                      <InfoTooltip term="expectedRent" />
                    </label>
                    {hasMarketStudy ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cyan-100 text-2xl font-mono font-bold">${inputs.expectedRent?.toLocaleString() || property.rentMin}</span>
                        </div>
                        <input
                          type="range"
                          min={property.rentMin}
                          max={property.rentMax}
                          step={50}
                          value={inputs.expectedRent || property.rentMin}
                          onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, expectedRent: parseInt(e.target.value) }); }}
                          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                          data-testid="slider-expected-rent"
                        />
                        <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                          <span>${property.rentMin.toLocaleString()}</span>
                          <span className="text-cyan-300">Current Condition</span>
                          <span>${property.rentMax.toLocaleString()}</span>
                        </div>
                        {effectiveRanges.postRehabRent.known && (
                          <div className="mt-3 pt-3 border-t border-emerald-500/20">
                            <div className="flex items-center gap-2 text-xs text-emerald-400/80 mb-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>After Fixing Issues</span>
                            </div>
                            <div className="flex justify-between text-xs text-emerald-400/60">
                              <span>${effectiveRanges.postRehabRent.min.toLocaleString()}</span>
                              <span className="text-emerald-300">Potential Rent</span>
                              <span>${effectiveRanges.postRehabRent.max.toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-emerald-400/50 mt-1">
                              Fix property issues to unlock higher rent
                            </p>
                          </div>
                        )}
                        {!effectiveRanges.postRehabRent.known && (
                          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Contractor or Inspection reveals rent potential after improvements
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="???"
                            value={inputs.expectedRent === null ? '' : inputs.expectedRent}
                            onChange={(e) => onInputsChange({ ...inputs, expectedRent: e.target.value === '' ? null : (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                            onFocus={() => onFieldTouch?.('expectedRent')}
                            className="w-full bg-slate-900/80 border-2 border-amber-500/40 rounded-xl pl-10 pr-4 py-4 text-cyan-100 text-xl font-mono font-bold focus:border-amber-400 focus:outline-none placeholder:text-amber-600/50"
                            data-testid="input-expected-rent"
                          />
                        </div>
                        <span className="text-amber-400/80 text-xs mt-2 block flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Complete Market Study to see comparable rents
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Vacancy Rate */}
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)] flex items-center gap-2">
                      Vacancy Rate
                      <InfoTooltip term="vacancyRate" />
                    </label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-100 text-2xl font-mono font-bold">{inputs.vacancyRate ?? 7}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={inputs.vacancyRate ?? 7}
                      onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, vacancyRate: parseInt(e.target.value) }); }}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      data-testid="slider-vacancy-rate"
                    />
                    <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                      <span>0%</span>
                      <span className="text-cyan-300">Typical: 5-7%</span>
                      <span>15%</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Itemized Repairs Panel - shows when diligence done */}
                  {hasDiligenceForIssues && revealedIssues.length > 0 ? (
                    <div className="col-span-full">
                      <ItemizedRepairsPanel
                        issues={revealedIssues}
                        selectedIssueIds={inputs.fixedIssueIds || []}
                        onSelectionChange={handleSelectedIssuesChange}
                        contractorType={inputs.contractorType}
                      />
                      {(inputs.rehabBudget ?? 0) > 0 && (
                        <div className="mt-3 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 text-sm">Total Rehab Budget:</span>
                            <span className="text-cyan-100 text-xl font-mono font-bold">${(inputs.rehabBudget ?? 0).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Rehab Budget slider - shown when no diligence or no issues */}
                      <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                        <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Rehab Budget</label>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-cyan-100 text-2xl font-mono font-bold">${(inputs.rehabBudget ?? 0).toLocaleString()}</span>
                          {(inputs.rehabBudget ?? 0) === 0 && (
                            <span className="text-emerald-400/60 text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">No Rehab</span>
                          )}
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={hasContractorWalkthrough || hasInspection ? property.rehabMax : Math.round(property.rehabMax * 1.5)}
                          step={1000}
                          value={inputs.rehabBudget ?? 0}
                          onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, rehabBudget: parseInt(e.target.value) }); }}
                          onFocus={() => onFieldTouch?.('rehabBudget')}
                          className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                          data-testid="slider-rehab-budget"
                        />
                        {hasContractorWalkthrough || hasInspection ? (
                          <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                            <span>$0</span>
                            <span className="text-cyan-300">
                              Diligence shows ${property.rehabMin.toLocaleString()}-${property.rehabMax.toLocaleString()}
                            </span>
                            <span>${property.rehabMax.toLocaleString()}</span>
                          </div>
                        ) : (
                          <div className="flex justify-between text-xs text-amber-400/60 mt-1">
                            <span>$0</span>
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Diligence reveals true costs
                            </span>
                            <span>${Math.round(property.rehabMax * 1.5).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Contingency */}
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Contingency</label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-100 text-2xl font-mono font-bold">{inputs.contingencyPct ?? 10}%</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      step={1}
                      value={inputs.contingencyPct ?? 10}
                      onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, contingencyPct: parseInt(e.target.value) }); }}
                      className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                      data-testid="slider-contingency"
                    />
                    <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                      <span>5%</span>
                      <span className="text-cyan-300">Buffer for surprises</span>
                      <span>25%</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* LTV Slider - always available */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                <label className="text-cyan-300 text-sm font-medium mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)] flex items-center gap-2">
                  Loan-to-Value (LTV)
                  <InfoTooltip term="ltv" />
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-mono font-bold ${inputs.ltv > 90 ? 'text-red-400' : 'text-cyan-100'}`}>{inputs.ltv}%</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    inputs.ltv > 90 ? 'bg-red-500/30 text-red-400 animate-pulse' : 
                    inputs.ltv >= 80 ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {inputs.ltv > 90 ? 'EXTREME LEVERAGE' : inputs.ltv >= 80 ? 'High Leverage' : 'Conservative'}
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={1}
                  value={inputs.ltv}
                  onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, ltv: parseInt(e.target.value) }); }}
                  className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                  data-testid="slider-ltv"
                />
                <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                  <span>50%</span>
                  <span className={inputs.ltv > 90 ? 'text-red-400 font-semibold' : 'text-cyan-300'}>
                    {inputs.ltv > 90 ? 'DANGER ZONE - Rates climb fast!' : 'More leverage = higher risk'}
                  </span>
                  <span className={inputs.ltv > 90 ? 'text-red-400' : ''}>100%</span>
                </div>
                
                {/* Dynamic Interest Rate Display - shows rate based on LTV + player financial position */}
                <div className={`mt-3 p-3 rounded-lg border ${
                  derivedInterestRate > 12 ? 'bg-red-900/30 border-red-500/40' :
                  derivedInterestRate > 8 ? 'bg-amber-900/20 border-amber-500/30' :
                  'bg-slate-700/50 border-slate-600/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Percent className={`w-4 h-4 ${
                        derivedInterestRate > 12 ? 'text-red-400' :
                        derivedInterestRate > 8 ? 'text-amber-400' :
                        'text-cyan-400'
                      }`} />
                      <span className="text-sm text-gray-300">Bank Rate</span>
                    </div>
                    <span className={`text-xl font-mono font-bold ${
                      derivedInterestRate > 12 ? 'text-red-400' :
                      derivedInterestRate > 8 ? 'text-amber-400' :
                      'text-green-400'
                    }`} data-testid="text-interest-rate">
                      {derivedInterestRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {derivedInterestRate > 12 
                      ? 'Extreme risk! Banks charging premium rates.'
                      : derivedInterestRate > 8
                      ? 'High leverage = higher rates from lenders.'
                      : playerFinancials && playerFinancials.totalMonthlyIncome > 0
                      ? 'Good financial position helps your rate.'
                      : 'Based on your LTV and financial position.'}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Down: {derivedDownPaymentPct.toFixed(0)}%</span>
                    <span>Loan Fees: {derivedLoanFeesPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {/* FLIP ONLY: Finance Rehab Toggle - requires contractor walkthrough */}
              {inputs.strategy === 'flip' && (inputs.rehabBudget ?? 0) > 0 && completedDiligence.includes('contractor_walkthrough') && (
                <div className="col-span-full">
                  <button
                    onClick={() => onInputsChange({ ...inputs, financeRehab: !inputs.financeRehab })}
                    className={`w-full rounded-xl p-3 border-2 transition-all ${
                      inputs.financeRehab 
                        ? 'bg-gradient-to-r from-amber-600/30 to-orange-600/30 border-amber-500/50 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-800/40 border-slate-600/30 hover:border-amber-500/30'
                    }`}
                    data-testid="toggle-finance-rehab"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          inputs.financeRehab 
                            ? 'bg-amber-500/30 text-amber-400' 
                            : 'bg-slate-700/50 text-gray-500'
                        }`}>
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className={`font-semibold text-sm ${inputs.financeRehab ? 'text-amber-300' : 'text-gray-300'}`}>
                            Finance Rehab Costs
                          </div>
                          <div className="text-xs text-gray-500">Include rehab in loan (construction loan)</div>
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full p-1 transition-all ${
                        inputs.financeRehab ? 'bg-amber-500' : 'bg-slate-600'
                      }`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          inputs.financeRehab ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${inputs.financeRehab ? 'text-amber-300/70' : 'text-gray-500'}`}>
                      {inputs.financeRehab 
                        ? `Rehab ($${(inputs.rehabBudget ?? 0).toLocaleString()}) added to loan - less cash upfront but higher interest`
                        : 'Pay rehab out of pocket - needs more cash but saves on interest'}
                    </p>
                  </button>
                </div>
              )}
              
              {/* Total Cash Needed */}
              <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-xl p-4 border border-cyan-400/40">
                <label className="text-cyan-200 text-sm font-medium mb-2 flex items-center gap-2">
                  Total Cash Needed
                  <InfoTooltip term="totalCashNeeded" />
                </label>
                <div className="text-cyan-100 text-2xl font-mono font-bold drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                  {formatCurrency(liveOutputs.totalCashInvested)}
                </div>
                <span className="text-cyan-300/60 text-xs mt-2 block">Your upfront investment</span>
              </div>
            </div>

            {/* FLIP: Estimated Sale Price (ARV) */}
            {inputs.strategy === 'flip' && (
              <div className="mt-4 pt-4 border-t border-amber-500/20">
                <p className="text-amber-400/70 text-xs uppercase tracking-wider mb-3">Estimated Sale Price</p>
                <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-amber-300 text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      After Repair Value (ARV)
                    </label>
                    {!hasAppraisal && (
                      <span className="text-amber-400/60 text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full">Speculative</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-amber-100 text-2xl font-mono font-bold">
                      ${(inputs.arvEstimate !== null ? inputs.arvEstimate : arvMid).toLocaleString()}
                    </span>
                  </div>
                  
                  <input
                    type="range"
                    min={hasAppraisal ? property.arvMin : Math.round(property.arvMin * 0.85)}
                    max={hasAppraisal ? property.arvMax : Math.round(property.arvMax * 1.15)}
                    step={1000}
                    value={inputs.arvEstimate !== null ? inputs.arvEstimate : arvMid}
                    onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, arvEstimate: parseInt(e.target.value) }); }}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    data-testid="slider-arv-estimate"
                  />
                  <div className="flex justify-between text-xs text-amber-400/60 mt-1">
                    <span>${(hasAppraisal ? property.arvMin : Math.round(property.arvMin * 0.85)).toLocaleString()}</span>
                    <span className="text-amber-300">{hasAppraisal ? 'Based on comps' : 'Wide range - get appraisal!'}</span>
                    <span>${(hasAppraisal ? property.arvMax : Math.round(property.arvMax * 1.15)).toLocaleString()}</span>
                  </div>
                  
                  {!hasAppraisal && (
                    <div className="mt-3 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20">
                      <p className="text-amber-300/70 text-[10px] leading-relaxed">
                        Without a comp analysis, your ARV is a guess. Over-estimating the sale price is the #1 mistake new flippers make.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RENTAL: Operating Costs - Taxes, Insurance, CapEx */}
            {inputs.strategy === 'rent' && (
              <div className="mt-4 pt-4 border-t border-cyan-500/20">
                <p className="text-cyan-400/70 text-xs uppercase tracking-wider mb-3">Operating Costs</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Annual Taxes */}
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-cyan-300/80 text-xs font-medium flex items-center gap-1.5">
                        Annual Taxes
                        <InfoTooltip term="taxesAnnual" />
                      </label>
                      <span className="text-cyan-400/50 text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded">1.5% rate</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-xs">Current (on ${(property.price / 1000).toFixed(0)}k):</span>
                      <span className="text-cyan-300 font-mono font-bold">${Math.round(property.price * 0.015).toLocaleString()}</span>
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70 text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={Math.round(property.price * 0.015).toString()}
                        value={inputs.taxesAnnual === null ? '' : inputs.taxesAnnual}
                        onChange={(e) => onInputsChange({ ...inputs, taxesAnnual: e.target.value === '' ? null : (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                        onFocus={() => onFieldTouch?.('taxesAnnual')}
                        className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-lg pl-8 pr-3 py-2 text-cyan-100 text-base font-mono font-bold focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                        data-testid="input-taxes-annual"
                      />
                    </div>
                    <span className="text-cyan-400/50 text-[10px] mt-1 block">Enter your estimate</span>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                    <label className="text-cyan-300/80 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                      Annual Insurance
                      <InfoTooltip term="insuranceAnnual" />
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400/70 text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={Math.round(property.price * 0.007).toString()}
                        value={inputs.insuranceAnnual === null ? '' : inputs.insuranceAnnual}
                        onChange={(e) => onInputsChange({ ...inputs, insuranceAnnual: e.target.value === '' ? null : (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                        onFocus={() => onFieldTouch?.('insuranceAnnual')}
                        className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-lg pl-8 pr-3 py-2.5 text-cyan-100 text-base font-mono font-bold focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                        data-testid="input-insurance-annual"
                      />
                    </div>
                  </div>
                
                {/* Rental-specific: Maintenance and CapEx with sliders */}
                {inputs.strategy === 'rent' && (
                  <>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                      <label className="text-cyan-300/80 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        Maintenance
                        <InfoTooltip term="maintenancePct" />
                      </label>
                      {hasContractorWalkthrough || hasInspection ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-cyan-100 text-lg font-mono font-bold">{inputs.maintenancePct ?? 5}%</span>
                            <span className="text-cyan-400/60 text-xs">${Math.round((inputs.expectedRent || 0) * (inputs.maintenancePct ?? 5) / 100)}/mo</span>
                          </div>
                          <input
                            type="range"
                            min={3}
                            max={12}
                            step={1}
                            value={inputs.maintenancePct ?? 5}
                            onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, maintenancePct: parseInt(e.target.value) }); }}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                            data-testid="slider-maintenance"
                          />
                          <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                            <span>3%</span>
                            <span className="text-cyan-300">Based on condition</span>
                            <span>12%</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              autoComplete="off"
                              placeholder="5"
                              value={inputs.maintenancePct === null ? '' : inputs.maintenancePct}
                              onChange={(e) => onInputsChange({ ...inputs, maintenancePct: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) })}
                              onFocus={() => onFieldTouch?.('maintenancePct')}
                              className="w-full bg-slate-900/60 border border-amber-500/30 rounded-lg px-3 py-2.5 text-cyan-100 text-base font-mono font-bold focus:border-amber-400 focus:outline-none placeholder:text-amber-600/50"
                              data-testid="input-maintenance"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/70 text-sm">%</span>
                          </div>
                          <span className="text-amber-400/80 text-xs mt-1 block flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Walkthrough/Inspection reveals condition
                          </span>
                        </>
                      )}
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                      <label className="text-cyan-300/80 text-xs font-medium mb-1.5 flex items-center gap-1.5">
                        CapEx Reserve
                        <InfoTooltip term="capExPct" />
                      </label>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-cyan-100 text-lg font-mono font-bold">{inputs.capExPct ?? 5}%</span>
                        <span className="text-cyan-400/60 text-xs">${Math.round((inputs.expectedRent || 0) * (inputs.capExPct ?? 5) / 100)}/mo</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={15}
                        step={1}
                        value={inputs.capExPct ?? 5}
                        onChange={(e) => { triggerHaptic(); onInputsChange({ ...inputs, capExPct: parseInt(e.target.value) }); }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        data-testid="slider-capex"
                      />
                      <div className="flex justify-between text-xs text-cyan-400/60 mt-1">
                        <span>3%</span>
                        <span className="text-cyan-300">Major repairs fund</span>
                        <span>15%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => onInputsChange({ ...inputs, propertyManagement: !inputs.propertyManagement })}
                className={`mt-3 w-full rounded-xl p-4 border-2 transition-all ${
                  inputs.propertyManagement 
                    ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 border-emerald-500/50 shadow-lg shadow-emerald-500/20' 
                    : 'bg-slate-800/40 border-slate-600/30 hover:border-cyan-500/30'
                }`}
                data-testid="toggle-property-management"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      inputs.propertyManagement 
                        ? 'bg-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-700/50 text-gray-500'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className={`font-semibold ${inputs.propertyManagement ? 'text-emerald-300' : 'text-gray-300'}`}>
                        Property Manager
                      </div>
                      <div className="text-xs text-gray-500">10% of rent - handles everything</div>
                    </div>
                  </div>
                  <div className={`w-12 h-7 rounded-full p-1 transition-all ${
                    inputs.propertyManagement ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      inputs.propertyManagement ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
                {!inputs.propertyManagement && (
                  <div className="mt-2 pt-2 border-t border-slate-600/30 flex items-center gap-2 text-amber-400/80">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Self-managing costs 1 month of your time</span>
                  </div>
                )}
              </button>
            </div>
          )}
          
          {/* FLIP: Permit costs (shown outside rental section) */}
          {inputs.strategy === 'flip' && (hasContractorWalkthrough || hasInspection) && (
            <div className="mt-4 bg-amber-900/30 rounded-xl p-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Landmark className="w-4 h-4 text-amber-400" />
                <label className="text-amber-300 text-xs font-medium">Permit Costs (Required for Rehab)</label>
              </div>
              <div className="text-amber-100 text-lg font-mono font-bold">
                ${Math.round((inputs.rehabBudget || 0) * 0.03).toLocaleString()}
              </div>
              <span className="text-amber-400/60 text-xs">~3% of rehab budget for building permits</span>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* LAYER 5: LIVE OUTCOMES */}
      <div className="xl:col-span-1">
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 p-4 sticky top-4">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Pro Forma Flow
          </h3>

          <div className="space-y-4">
            {/* RENTAL STRATEGY: Show Formula Waterfall */}
            {inputs.strategy === 'rent' && (
              <div className="space-y-3">
                {/* Step 1A: Gross Monthly Rent */}
                <div className={`bg-slate-800/50 rounded-xl p-3 border transition-all ${highlightField === 'effectiveRent' ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-700'}`}>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 1A: Gross Monthly Rent</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {formatCurrency(n(inputs.expectedRent))}<span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Market rent for this property</div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                {/* Step 1B: Vacancy Reserve */}
                <div className={`bg-slate-800/50 rounded-xl p-3 border transition-all ${highlightField === 'effectiveRent' ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-slate-700'}`}>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 1B: Vacancy Reserve ({n(inputs.vacancyRate)}%)</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      ${n(inputs.expectedRent).toLocaleString()} × {n(inputs.vacancyRate)}%
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-red-400">
                    -{formatCurrency(n(inputs.expectedRent) * n(inputs.vacancyRate) / 100)}<span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Months between tenants, turnover costs</div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                {/* Result: Average Monthly Rent Income */}
                <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/30">
                  <div className="text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-1">= Average Monthly Rent Income</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-400 mb-2">
                      {formatCurrency(n(inputs.expectedRent))} - {formatCurrency(n(inputs.expectedRent) * n(inputs.vacancyRate) / 100)}
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    = {formatCurrency(effectiveRent)}<span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-emerald-500/70 mt-1">What you actually collect over time</div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                {/* Step 2: Operating Expenses */}
                <div className={`bg-slate-800/50 rounded-xl p-3 border transition-all ${highlightField === 'opex' ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-slate-700'}`}>
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 2: Operating Expenses</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-500 space-y-0.5 mb-2">
                      <div>Taxes: ${(n(inputs.taxesAnnual)/12).toFixed(0)}/mo</div>
                      <div>Insurance: ${(n(inputs.insuranceAnnual)/12).toFixed(0)}/mo</div>
                      <div>Maintenance: ${(n(inputs.expectedRent) * n(inputs.maintenancePct)/100).toFixed(0)}/mo ({n(inputs.maintenancePct)}%)</div>
                      <div>CapEx: ${(n(inputs.expectedRent) * n(inputs.capExPct)/100).toFixed(0)}/mo ({n(inputs.capExPct)}%)</div>
                      {inputs.utilities && <div>Utilities: ${n(inputs.utilitiesMonthly)}/mo</div>}
                      {inputs.propertyManagement && <div>Mgmt: ${(n(inputs.expectedRent) * PROPERTY_MANAGEMENT_FEE_PCT / 100).toFixed(0)}/mo ({PROPERTY_MANAGEMENT_FEE_PCT}%)</div>}
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-red-400">
                    = {formatCurrency(monthlyExpenses)}<span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Monthly costs to operate the property</div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                {/* Step 3: NOI */}
                <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/30">
                  <div className="text-blue-400 text-xs uppercase tracking-wider font-semibold mb-1">Step 3: Net Operating Income (NOI)</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-400 mb-2">
                      {formatCurrency(effectiveRent)} - {formatCurrency(monthlyExpenses)}
                    </div>
                  )}
                  <div className={`text-2xl font-bold font-mono ${liveOutputs.noiMonthly > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    = {formatCurrency(liveOutputs.noiMonthly)}<span className="text-sm text-gray-500">/mo</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Income before debt service</div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                {/* Debt Service - Always visible as its own prominent line */}
                <div className="bg-slate-800/50 rounded-xl p-3 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">Monthly Debt Service</div>
                      <div className="text-gray-500 text-xs">Your mortgage payment</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold font-mono text-amber-300" data-testid="text-debt-service">
                        -{formatCurrency(liveOutputs.debtServiceMonthly)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {derivedInterestRate.toFixed(1)}% rate / 30yr
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>

                {/* Step 4: Cash Flow */}
                <div className={`rounded-xl p-4 border ${canShowViability ? (isViable ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50') : 'bg-slate-800/50 border-slate-700'}`} data-testid="cash-flow-display">
                  <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${canShowViability ? (isViable ? 'text-emerald-400' : 'text-red-400') : 'text-gray-400'}`}>
                    Step 4: Monthly Cash Flow
                  </div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-400 mb-2">
                      {formatCurrency(liveOutputs.noiMonthly)} - {formatCurrency(liveOutputs.debtServiceMonthly)}
                      <div className="text-gray-500 text-xs mt-0.5">(NOI - Debt Service)</div>
                    </div>
                  )}
                  <div className={`text-3xl font-bold font-mono ${canShowViability ? (isViable ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                    = {formatCurrency(liveOutputs.cashFlowMonthly)}
                  </div>
                  {canShowViability ? (
                    <div className={`text-xs mt-1 ${isViable ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isViable ? 'Money in your pocket each month' : 'Losing money each month'}
                    </div>
                  ) : (
                    <div className="text-xs mt-1 text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Complete 2+ due diligence to see if this works
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FLIP STRATEGY: Show simplified flow */}
            {inputs.strategy === 'flip' && (
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Project Cost</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      Purchase + Closing + Rehab + Contingency<br/>
                      ${property.price.toLocaleString()} + ${closingCosts.toLocaleString()} + ${n(inputs.rehabBudget).toLocaleString()} + ${(n(inputs.rehabBudget) * n(inputs.contingencyPct)/100).toFixed(0)}
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    = {formatCurrency(allInBasis)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Total cost to buy and renovate</div>
                </div>

                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Holding Costs</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      ${holdingCostPerWeek.toLocaleString()}/month × {n(inputs.rehabWeeks)} months
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-red-400">
                    = {formatCurrency(holdingCostPerWeek * n(inputs.rehabWeeks))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Interest + taxes while renovating</div>
                </div>

                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Selling Costs</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      {inputs.sellingCostsPct}% × {formatCurrency(arvMid)}
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-red-400">
                    = {formatCurrency(sellingCosts)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Realtor, title, closing costs</div>
                </div>

                <div className="flex justify-center">
                  <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-gray-600" /></div>
                </div>

                <div className={`rounded-xl p-4 border ${canShowViability ? (flipProfit > 0 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50') : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${canShowViability ? (flipProfit > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-400'}`}>
                    Projected Flip Profit
                  </div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-400 mb-2">
                      ARV - Total Cost - Holding Costs<br/>
                      {formatCurrency(arvMid)} - {formatCurrency(allInBasis)} - {formatCurrency(holdingCostPerWeek * n(inputs.rehabWeeks))}
                    </div>
                  )}
                  <div className={`text-3xl font-bold font-mono ${canShowViability ? (flipProfit > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                    = {formatCurrency(flipProfit)}
                  </div>
                  {canShowViability ? (
                    <div className={`text-xs mt-1 ${flipProfit > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {flipProfit > 0 ? 'Profit on sale' : 'Losing money on this flip'}
                    </div>
                  ) : (
                    <div className="text-xs mt-1 text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Complete 2+ due diligence to see if this works
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {inputs.strategy === 'rent' ? (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">Cash-on-Cash</div>
                    {canShowReturns ? (
                      <div className={`text-lg font-bold font-mono ${liveOutputs.cashOnCash > 8 ? 'text-emerald-400' : liveOutputs.cashOnCash > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                        {liveOutputs.cashOnCash.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="text-amber-400 text-sm flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3" /> ???
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">Cap Rate</div>
                    {canShowReturns ? (
                      <div className={`text-lg font-bold font-mono ${liveOutputs.capRate > 6 ? 'text-emerald-400' : liveOutputs.capRate > 4 ? 'text-amber-400' : 'text-red-400'}`}>
                        {liveOutputs.capRate.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="text-amber-400 text-sm flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3" /> ???
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">ROI</div>
                    {canShowReturns ? (
                      <div className={`text-lg font-bold font-mono ${flipROI > 20 ? 'text-emerald-400' : flipROI > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                        {flipROI.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="text-amber-400 text-sm flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3" /> ???
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">Hold Time</div>
                    <div className="text-white font-bold font-mono text-lg">
                      {inputs.rehabWeeks}mo
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="text-gray-400 text-xs mb-1">Total Project Cash</div>
              <div className="text-white font-bold font-mono text-lg">{formatCurrency(liveOutputs.totalCashInvested)}</div>
            </div>

            {canShowViability ? (
              <button
                onClick={onCalculate}
                className="w-full px-5 py-4 rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                data-testid="button-calculate"
              >
                <CheckCircle className="w-4 h-4" /> Ready to Buy
              </button>
            ) : (
              <div className="w-full rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-bold text-sm">Due Diligence Incomplete</span>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  You haven't completed enough research on this property. Key financial metrics are still hidden.
                </p>
                
                <div className="space-y-2">
                  {onReturnToProperty && (
                    <button
                      onClick={onReturnToProperty}
                      className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                      data-testid="button-return-to-property"
                    >
                      ← Return to Due Diligence (Recommended)
                    </button>
                  )}
                  
                  {onProceedWithoutDiligence && (
                    <button
                      onClick={onProceedWithoutDiligence}
                      className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-amber-600/80 to-orange-600/80 hover:from-amber-500 hover:to-orange-500 text-white font-semibold text-sm transition-all border-2 border-amber-400/50 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                      data-testid="button-proceed-without-diligence"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Proceed Without Full Diligence
                    </button>
                  )}
                </div>
                
                <p className="text-gray-500 text-xs mt-3 italic">
                  Skipping due diligence may lead to surprise costs and hidden issues when the deal closes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}