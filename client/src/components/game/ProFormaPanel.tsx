import { useState, useMemo } from 'react';
import { ProFormaInputs, ProFormaOutputs, formatCurrency, calculateProForma, isProFormaInputsComplete, getMissingFields, requiredRentFields, requiredFlipFields, LTV_MIN, LTV_MAX, getInterestRateFromLTV, getLoanFeesFromLTV, getDownPaymentFromLTV, PROPERTY_MANAGEMENT_FEE_PCT } from '@/lib/gameData';
import { getEffectiveRanges, EffectiveRanges } from '@/lib/propertyIssues';
import { Building2, Landmark, TrendingUp, Clock, AlertTriangle, DollarSign, Percent, Home, Zap, ChevronDown, ChevronUp, HelpCircle, Lock, X, CheckCircle, Edit3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AssumptionInput, PercentAssumption } from './AssumptionInput';
import { FormulaCanvas, MiniFormula } from './FormulaCanvas';
import { ProFormaEditor } from './ProFormaEditor';
import type { Property } from '@shared/schema';

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

const TERM_DEFINITIONS: Record<string, string> = {
  purchasePrice: "The price you're paying to buy the property. This is your starting point for all calculations.",
  closingCosts: "Fees paid when the sale is finalized - includes lender's title insurance (required), attorney fees, recording fees, transfer taxes, etc. Typically 2-4% of purchase price.",
  rehabBudget: "The money you plan to spend fixing up the property - repairs, renovations, upgrades. Unknown until you do a Contractor Walkthrough.",
  contingency: "Extra buffer for unexpected costs. Things always cost more than expected! 10-20% is common for experienced investors.",
  allInBasis: "Total Project Cost - the full cost to acquire and renovate the property: purchase price + closing costs + rehab + contingency. This is your break-even point.",
  arv: "After Repair Value (ARV) - what the property will be worth after you fix it up. Critical for flip deals. In real life, find comps on Zillow, Redfin, or your local MLS. Look for recently sold similar properties in the same neighborhood that have been renovated.",
  downPayment: "Cash you put in upfront. The rest comes from your lender. Higher down payment = lower monthly payments but more cash tied up.",
  interestRate: "The yearly cost of borrowing money, expressed as a percentage. Higher LTV means more risk for lenders, so they charge higher rates (5% at 50% LTV up to 12% at 90% LTV).",
  loanTerm: "How long you have to pay back the loan. Longer terms = lower monthly payments but more total interest paid over time.",
  expectedRent: "What tenants will pay monthly. Be conservative - overestimating rent is the #1 mistake new investors make. In real life, check Zillow Rent Zestimate, Rentometer, or Craigslist listings for comparable units in the area.",
  vacancyRate: "Percentage of time the property sits empty between tenants. 5-10% is typical in most markets - that's about 2-5 weeks per year with no income.",
  taxesAnnual: "Yearly property taxes paid to the county. Usually 1-3% of property value depending on location. Check the county assessor's website.",
  insuranceAnnual: "Yearly insurance premium. Landlord/investor policies cost more than regular homeowner's insurance because of liability coverage.",
  maintenancePct: "Ongoing repair costs as a percentage of rent. Budget 5-10% for maintenance reserves - things like fixing leaky faucets, painting, minor repairs. Older properties need more.",
  capExPct: "Capital Expenditures (CapEx) - Big-ticket replacements like roof, HVAC, water heater, appliances. Unlike maintenance (ongoing repairs), CapEx covers major systems that wear out. Budget 8-12% of rent. This is separate from your rehab budget.",
  utilities: "If you pay utilities (water, sewer, trash, gas/electric) instead of tenants, factor this in. Multi-family often has owner-paid utilities. Adds $100-200/month typically.",
  propertyManagement: "Hiring a company to handle tenant screening, rent collection, repairs, and day-to-day operations. Typically 8-10% of collected rent.",
  rehabWeeks: "How long the renovation will take. Add buffer time - contractors are almost never early! Unknown until you do a Contractor Walkthrough.",
  holdingCosts: "Costs you pay while owning the property: loan payments, taxes, insurance, utilities. These add up fast during rehab - every week costs money!",
  cashOnCash: "Cash-on-Cash Return (CoC) - Your annual cash profit divided by cash you invested. If you put in $50,000 and earn $5,000/year, that's 10% CoC. Target: 8%+ for rentals.",
  capRate: "Capitalization Rate - Net Operating Income (NOI) divided by property value. Measures the property's return ignoring financing. 6-10% is typical. Higher = better return.",
  cashFlow: "Money left over after ALL expenses and mortgage are paid each month. Positive = you're making money. Negative = you're losing money. Always aim for positive!",
  roi: "Return on Investment - Your total profit divided by cash invested. For flips, aim for 20%+ to account for risk and surprises.",
  flipProfit: "Your profit on a flip: Sale Price (ARV) minus all costs (purchase + closing + rehab + holding costs). What's left is what you pocket.",
  noi: "Net Operating Income (NOI) - Annual rental income minus operating expenses (taxes, insurance, maintenance, management). Does NOT include mortgage payments.",
  debtService: "Monthly mortgage payment including principal and interest. This comes out of your NOI to determine cash flow.",
  leverage: "Using borrowed money (LTV = Loan-to-Value). Higher LTV means less cash down but higher interest rates and loan fees. Risk increases with leverage.",
  loanOriginationFees: "Upfront fees to get the loan - points, origination fees, underwriting. Scales with LTV: 1% at 50% LTV up to 4% at 90% LTV. This is cash you need at closing.",
  sellingCosts: "Cost to sell the property after rehab - realtor commission (5-6%), title insurance, transfer taxes, closing costs. Total is typically 8-10% of sale price. Many new flippers forget this!",
  unknownRent: "Rent is unknown until you complete a Market Rent Study. Without it, you're just guessing what tenants will pay!",
  unknownRehab: "Rehab costs and timeline are unknown until you complete a Contractor Walkthrough. Guessing renovation costs is dangerous!",
  unknownArv: "After Repair Value is unknown until you complete a Comp Analysis. You need to know what similar fixed-up homes sold for.",
  thresholdCoC: "8% Cash-on-Cash is the minimum for a good rental deal. Below this, your money might work harder in other investments.",
  thresholdROI: "20% ROI is the minimum for a good flip. You need this margin to absorb surprises and still profit.",
};

function InfoTooltip({ term }: { term: keyof typeof TERM_DEFINITIONS }) {
  const definition = TERM_DEFINITIONS[term];
  if (!definition) return null;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-1 text-gray-500 hover:text-gray-300 transition-colors touch-manipulation p-2 -m-1 active:opacity-70" type="button">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[100]">
        <p>{definition}</p>
      </PopoverContent>
    </Popover>
  );
}

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
      explanation: "You don't know how long repairs will take. Every extra week costs money in holding costs!",
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
  onReturnToProperty?: () => void;
  onProceedWithoutDiligence?: () => void;
  skippedDiligence?: boolean;
  touchedFields?: Set<keyof ProFormaInputs>;
  onFieldTouch?: (fieldKey: keyof ProFormaInputs) => void;
}

export function ProFormaPanel({ property, inputs, onInputsChange, onCalculate, completedDiligence = [], playerCash = 50000, onReturnToProperty, onProceedWithoutDiligence, skippedDiligence = false, touchedFields = new Set(), onFieldTouch }: ProFormaPanelProps) {
  const effectiveRanges = useMemo(() => getEffectiveRanges(
    {
      rentMin: property.rentRange?.[0] ?? property.rentMin ?? 1000,
      rentMax: property.rentRange?.[1] ?? property.rentMax ?? 2000,
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
    return calculateProForma(inputs, property);
  }, [inputs, property]);

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
  
  const derivedInterestRate = getInterestRateFromLTV(inputs.ltv);
  const derivedLoanFeesPct = getLoanFeesFromLTV(inputs.ltv);
  const derivedDownPaymentPct = getDownPaymentFromLTV(inputs.ltv);
  
  const holdingCostPerWeek = Math.round((property.price * (derivedInterestRate / 100) / 52) + 
    (n(inputs.taxesAnnual) / 52) + (n(inputs.insuranceAnnual) / 52));

  const arvMid = (property.arvMin + property.arvMax) / 2;
  const sellingCosts = arvMid * (n(inputs.sellingCostsPct) / 100);
  const flipProfit = arvMid - allInBasis - (holdingCostPerWeek * n(inputs.rehabWeeks)) - sellingCosts;
  const flipROI = liveOutputs.totalCashInvested > 0 ? (flipProfit / liveOutputs.totalCashInvested) * 100 : 0;

  const isViable = inputs.strategy === 'rent' 
    ? liveOutputs.cashFlowMonthly > 0 
    : flipProfit > 0;
  
  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasAppraisal = completedDiligence.includes('appraisal');
  const hasContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');
  const hasInspection = completedDiligence.includes('inspection');
  
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

        {/* INLINE PRO FORMA - Soft blue theme with large inputs */}
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

            {/* Inline Editable Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inputs.strategy === 'rent' ? (
                <>
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Expected Rent</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="1500"
                        value={inputs.expectedRent === null ? '' : inputs.expectedRent}
                        onChange={(e) => onInputsChange({ ...inputs, expectedRent: e.target.value === '' ? null : (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                        onFocus={() => onFieldTouch?.('expectedRent')}
                        className="w-full bg-slate-900/80 border-2 border-cyan-500/40 rounded-xl pl-10 pr-4 py-4 text-cyan-100 text-xl font-mono font-bold focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-600"
                        data-testid="input-expected-rent"
                      />
                    </div>
                    <span className="text-cyan-400/60 text-xs mt-2 block">Monthly rent income</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Vacancy Rate</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="5"
                        value={inputs.vacancyRate === null ? '' : inputs.vacancyRate}
                        onChange={(e) => onInputsChange({ ...inputs, vacancyRate: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) })}
                        onFocus={() => onFieldTouch?.('vacancyRate')}
                        className="w-full bg-slate-900/80 border-2 border-cyan-500/40 rounded-xl px-4 py-4 text-cyan-100 text-xl font-mono font-bold focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-600"
                        data-testid="input-vacancy-rate"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold">%</span>
                    </div>
                    <span className="text-cyan-400/60 text-xs mt-2 block">Time property sits empty</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Rehab Budget</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="25000"
                        value={inputs.rehabBudget === null ? '' : inputs.rehabBudget}
                        onChange={(e) => onInputsChange({ ...inputs, rehabBudget: e.target.value === '' ? null : (parseFloat(e.target.value.replace(/,/g, '')) || 0) })}
                        onFocus={() => onFieldTouch?.('rehabBudget')}
                        className="w-full bg-slate-900/80 border-2 border-cyan-500/40 rounded-xl pl-10 pr-4 py-4 text-cyan-100 text-xl font-mono font-bold focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-600"
                        data-testid="input-rehab-budget"
                      />
                    </div>
                    <span className="text-cyan-400/60 text-xs mt-2 block">Total renovation costs</span>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                    <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Contingency</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="10"
                        value={inputs.contingencyPct === null ? '' : inputs.contingencyPct}
                        onChange={(e) => onInputsChange({ ...inputs, contingencyPct: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) })}
                        onFocus={() => onFieldTouch?.('contingencyPct')}
                        className="w-full bg-slate-900/80 border-2 border-cyan-500/40 rounded-xl px-4 py-4 text-cyan-100 text-xl font-mono font-bold focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-600"
                        data-testid="input-contingency"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold">%</span>
                    </div>
                    <span className="text-cyan-400/60 text-xs mt-2 block">Buffer for surprises</span>
                  </div>
                </>
              )}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/20">
                <label className="text-cyan-300 text-sm font-medium block mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Loan-to-Value (LTV)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="75"
                    value={inputs.ltv === null ? '' : inputs.ltv}
                    onChange={(e) => onInputsChange({ ...inputs, ltv: e.target.value === '' ? 75 : Math.min(90, Math.max(50, parseFloat(e.target.value) || 50)) })}
                    onFocus={() => onFieldTouch?.('ltv')}
                    className="w-full bg-slate-900/80 border-2 border-cyan-500/40 rounded-xl px-4 py-4 text-cyan-100 text-xl font-mono font-bold focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 placeholder:text-slate-600"
                    data-testid="input-ltv"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-400 text-lg font-bold">%</span>
                </div>
                <span className="text-cyan-400/60 text-xs mt-2 block">50-90% (higher = more leverage)</span>
              </div>
              <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-xl p-4 border border-cyan-400/40">
                <label className="text-cyan-200 text-sm font-medium block mb-2">Total Cash Needed</label>
                <div className="text-cyan-100 text-2xl font-mono font-bold drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]">
                  {formatCurrency(liveOutputs.totalCashInvested)}
                </div>
                <span className="text-cyan-300/60 text-xs mt-2 block">Your upfront investment</span>
              </div>
            </div>

            {/* Additional Fields - Taxes, Insurance, CapEx */}
            <div className="mt-4 pt-4 border-t border-cyan-500/20">
              <p className="text-cyan-400/70 text-xs uppercase tracking-wider mb-3">Operating Costs</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                  <label className="text-cyan-300/80 text-xs font-medium block mb-1.5">Annual Taxes</label>
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
                      className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-lg pl-8 pr-3 py-2.5 text-cyan-100 text-base font-mono font-bold focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                      data-testid="input-taxes-annual"
                    />
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                  <label className="text-cyan-300/80 text-xs font-medium block mb-1.5">Annual Insurance</label>
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
                {inputs.strategy === 'rent' && (
                  <>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                      <label className="text-cyan-300/80 text-xs font-medium block mb-1.5">CapEx Reserve</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="5"
                          value={inputs.capExPct === null ? '' : inputs.capExPct}
                          onChange={(e) => onInputsChange({ ...inputs, capExPct: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) })}
                          onFocus={() => onFieldTouch?.('capExPct')}
                          className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-cyan-100 text-base font-mono font-bold focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                          data-testid="input-capex"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/70 text-sm">%</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                      <label className="text-cyan-300/80 text-xs font-medium block mb-1.5">Maintenance</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="5"
                          value={inputs.maintenancePct === null ? '' : inputs.maintenancePct}
                          onChange={(e) => onInputsChange({ ...inputs, maintenancePct: e.target.value === '' ? null : (parseFloat(e.target.value) || 0) })}
                          onFocus={() => onFieldTouch?.('maintenancePct')}
                          className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-lg px-3 py-2.5 text-cyan-100 text-base font-mono font-bold focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                          data-testid="input-maintenance"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/70 text-sm">%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {inputs.strategy === 'rent' && (
                <div className="mt-3 flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-cyan-500/10">
                  <input
                    type="checkbox"
                    id="propertyManagement"
                    checked={inputs.propertyManagement || false}
                    onChange={(e) => onInputsChange({ ...inputs, propertyManagement: e.target.checked })}
                    className="w-5 h-5 rounded border-cyan-500/40 bg-slate-900/60 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <label htmlFor="propertyManagement" className="text-cyan-200 text-sm flex-1">
                    Hire Property Manager (10% of rent)
                  </label>
                </div>
              )}
            </div>
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
                  <div className="text-gray-600">↓</div>
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
                  <div className="text-gray-600">↓</div>
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
                  <div className="text-gray-600">↓</div>
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
                  <div className="text-gray-600">↓</div>
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
                  <div className="text-gray-600">↓</div>
                </div>

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
                      {isViable ? '✓ Money in your pocket each month' : '✗ Losing money each month'}
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
                  <div className="text-gray-600">↓</div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Holding Costs</div>
                  {showFormulas && (
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      ${holdingCostPerWeek.toLocaleString()}/week × {n(inputs.rehabWeeks)} weeks
                    </div>
                  )}
                  <div className="text-2xl font-bold font-mono text-red-400">
                    = {formatCurrency(holdingCostPerWeek * n(inputs.rehabWeeks))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Interest + taxes while renovating</div>
                </div>

                <div className="flex justify-center">
                  <div className="text-gray-600">↓</div>
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
                  <div className="text-gray-600">↓</div>
                </div>

                <div className={`rounded-xl p-4 border ${canShowViability ? (flipProfit > 0 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-red-500/20 border-red-500/50') : 'bg-slate-800/50 border-slate-700'}`}>
                  <div className={`text-xs uppercase tracking-wider font-semibold mb-1 ${canShowViability ? (flipProfit > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-gray-400'}`}>
                    Flip Profit
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
                      {flipProfit > 0 ? '✓ Profit on sale' : '✗ Losing money on this flip'}
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
                      {inputs.rehabWeeks}w
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
                <span>✓</span> Ready to Buy
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
                      className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs transition-all border border-slate-600"
                      data-testid="button-proceed-without-diligence"
                    >
                      Proceed Anyway (Not Recommended)
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