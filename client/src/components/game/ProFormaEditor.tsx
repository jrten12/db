import { useState, useMemo } from 'react';
import { X, HelpCircle, TrendingUp, DollarSign, Percent, Home, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { ProFormaInputs, formatCurrency, calculateProForma, isProFormaInputsComplete, getMissingFields, requiredRentFields, requiredFlipFields, LTV_MIN, LTV_MAX, getInterestRateFromLTV, getInterestRateWithPlayerState, getLoanFeesFromLTV, getDownPaymentFromLTV, PlayerFinancials, FINISH_LEVEL_CONFIG } from '@/lib/gameData';
import { getEffectiveRanges } from '@/lib/propertyIssues';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Property } from '@shared/schema';

const n = (val: number | null): number => val ?? 0;

const isFilled = (val: number | null | boolean | string): boolean => {
  if (typeof val === 'boolean') return true;
  if (typeof val === 'string') return val.trim().length > 0;
  if (typeof val === 'number') return !isNaN(val);
  return val !== null && val !== undefined;
};

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
  expectedRent: "What tenants will pay monthly. Be conservative - overestimating rent is the #1 mistake new investors make. Check Zillow Rent Zestimate, Rentometer, or Craigslist for comparable units.",
  vacancyRate: "Percentage of time the property sits empty between tenants. 5-10% is typical in most markets - that's about 2-5 months per year with no income.",
  taxesAnnual: "Yearly property taxes paid to the county. Usually 1-3% of property value depending on location. Check the county assessor's website.",
  insuranceAnnual: "Yearly insurance premium. Landlord/investor policies cost more than regular homeowner's insurance because of liability coverage.",
  maintenancePct: "Ongoing repair costs as a percentage of rent. Budget 5-10% for maintenance reserves - things like fixing leaky faucets, painting, minor repairs. Older properties need more.",
  capExPct: "Capital Expenditures (CapEx) - Big-ticket replacements like roof, HVAC, water heater, appliances. Unlike maintenance (ongoing repairs), CapEx covers major systems that wear out. Budget 8-12% of rent. This is separate from your rehab budget.",
  utilities: "If you pay utilities (water, sewer, trash, gas/electric) instead of tenants, factor this in. Multi-family often has owner-paid utilities. Adds $100-200/month typically.",
  propertyManagement: "Hiring a company to handle tenant screening, rent collection, repairs, and day-to-day operations. Fixed 5% of rent. If you self-manage, you save money but lose 1 month of time and get tenant texts.",
  rehabBudget: "The money you plan to spend fixing up the property - repairs, renovations, upgrades. Unknown until you do a Contractor Walkthrough.",
  rehabWeeks: "How long the renovation will take. Add buffer time - contractors are almost never early! Unknown until you do a Contractor Walkthrough.",
  contingencyPct: "Extra buffer for unexpected costs. Things always cost more than expected! 10-20% is common for experienced investors.",
  sellingCostsPct: "Cost to sell the property after rehab - realtor commission (5-6%), title insurance, transfer taxes, closing costs. Total is typically 8-10% of sale price. Many new flippers forget this!",
  ltv: "Loan-to-Value (LTV) - Using borrowed money. Higher LTV means less cash down but higher interest rates and loan fees. Risk increases with leverage.",
  propertyManagementPct: "Standard property management fee as % of rent. Typical range is 8-10% of collected rent.",
  utilitiesMonthly: "Monthly cost for utilities if landlord pays (water, sewer, trash, gas, electric). Usually $100-200/month.",
};

function InfoTooltip({ term }: { term: keyof typeof TERM_DEFINITIONS }) {
  const definition = TERM_DEFINITIONS[term];
  if (!definition) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-gray-500 hover:text-gray-300 transition-colors p-1 -m-1" type="button">
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[200]">
        <p>{definition}</p>
      </PopoverContent>
    </Popover>
  );
}

interface FieldRowProps {
  label: string;
  term?: keyof typeof TERM_DEFINITIONS;
  rangeGuidance?: string;
  rangeColor?: 'green' | 'amber' | 'gray';
  children: React.ReactNode;
  isLocked?: boolean;
  lockMessage?: string;
}

function FieldRow({ label, term, rangeGuidance, rangeColor = 'gray', children, isLocked, lockMessage }: FieldRowProps) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-[1fr,1fr,2fr] gap-2 md:gap-4 md:items-center py-4 md:py-3 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors px-4">
      {/* Row 1 on mobile / Column 1 on desktop: Label + Guidance */}
      <div className="flex items-center justify-between md:justify-start gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-sm font-medium">{label}</span>
          {term && <InfoTooltip term={term} />}
        </div>
        {/* Show guidance inline on mobile */}
        <div className="md:hidden">
          {isLocked ? (
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Lock className="w-3 h-3" />
              <span>{lockMessage || 'Unknown'}</span>
            </div>
          ) : rangeGuidance ? (
            <span className={`text-xs font-mono ${
              rangeColor === 'green' ? 'text-emerald-400' :
              rangeColor === 'amber' ? 'text-amber-400' :
              'text-gray-400'
            }`}>
              {rangeGuidance}
            </span>
          ) : null}
        </div>
      </div>

      {/* Column 2: Range Guidance (desktop only) */}
      <div className="hidden md:block text-right">
        {isLocked ? (
          <div className="flex items-center justify-end gap-1 text-amber-400 text-xs">
            <Lock className="w-3 h-3" />
            <span>{lockMessage || 'Unknown'}</span>
          </div>
        ) : rangeGuidance ? (
          <span className={`text-xs font-mono ${
            rangeColor === 'green' ? 'text-emerald-400' :
            rangeColor === 'amber' ? 'text-amber-400' :
            'text-gray-400'
          }`}>
            {rangeGuidance}
          </span>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </div>

      {/* Row 2 on mobile / Column 3 on desktop: Input */}
      <div className="mt-2 md:mt-0">{children}</div>
    </div>
  );
}

interface SliderInputProps {
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  prefix?: string;
  formatValue?: (val: number) => string;
  getColor?: (val: number) => string;
}

function SliderInput({ value, onChange, min, max, step = 1, suffix = '', prefix = '', formatValue, getColor }: SliderInputProps) {
  const [editingValue, setEditingValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const displayValue = value ?? min;
  const normalizedValue = ((displayValue - min) / (max - min)) * 100;

  const color = getColor ? getColor(displayValue) : '#10b981';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingValue(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(editingValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-3 md:h-2 rounded-full appearance-none cursor-pointer touch-pan-x"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${normalizedValue}%, #334155 ${normalizedValue}%, #334155 100%)`
        }}
      />
      <input
        type="text"
        inputMode="decimal"
        value={isEditing ? editingValue : (formatValue ? formatValue(displayValue) : displayValue)}
        onFocus={() => {
          setIsEditing(true);
          setEditingValue(String(displayValue));
        }}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="w-20 md:w-24 bg-slate-800 border border-slate-600 rounded-lg px-2 md:px-3 py-2 md:py-1.5 text-white text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {(prefix || suffix) && (
        <span className="text-gray-400 text-sm font-mono w-8">{prefix}{suffix}</span>
      )}
    </div>
  );
}

interface TextInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}

function TextInput({ value, onChange, placeholder, prefix = '$', suffix }: TextInputProps) {
  const [editingValue, setEditingValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingValue(val);
    if (val === '' || val === '-') {
      onChange(null);
    } else {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editingValue === '' || editingValue === '-') {
      onChange(null);
    } else {
      const parsed = parseFloat(editingValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  const displayValue = isEditing
    ? editingValue
    : value !== null && value !== undefined
      ? (prefix === '$' ? formatCurrency(value).replace('$', '') : String(value))
      : '';

  return (
    <div className="flex items-center gap-2">
      {prefix && <span className="text-gray-400 text-sm font-mono">{prefix}</span>}
      <input
        type="text"
        value={displayValue}
        onFocus={() => {
          setIsEditing(true);
          setEditingValue(value !== null && value !== undefined ? String(value) : '');
        }}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-600"
      />
      {suffix && <span className="text-gray-400 text-sm font-mono">{suffix}</span>}
    </div>
  );
}

interface ProFormaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property & { rentRange: [number, number] };
  inputs: ProFormaInputs;
  onInputsChange: (inputs: ProFormaInputs) => void;
  completedDiligence?: string[];
  onFieldTouch?: (fieldKey: keyof ProFormaInputs) => void;
  playerFinancials?: PlayerFinancials;
  weekNumber?: number;
}

export function ProFormaEditor({ isOpen, onClose, property, inputs, onInputsChange, completedDiligence = [], onFieldTouch, playerFinancials, weekNumber = 1 }: ProFormaEditorProps) {
  if (!isOpen) return null;

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

  const handleChange = <K extends keyof ProFormaInputs>(key: K, value: ProFormaInputs[K]) => {
    onInputsChange({ ...inputs, [key]: value });
    if (onFieldTouch) {
      onFieldTouch(key);
    }
  };

  const liveOutputs = useMemo(() => {
    return calculateProForma(inputs, property, playerFinancials, weekNumber);
  }, [inputs, property, playerFinancials, weekNumber]);

  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasAppraisal = completedDiligence.includes('appraisal');
  const hasContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');

  const isRental = inputs.strategy === 'rent';
  const isFlip = inputs.strategy === 'flip';

  // Comp-based guidance
  const rentGuidance = hasMarketStudy
    ? `${formatCurrency(effectiveRanges.rent.min)}-${formatCurrency(effectiveRanges.rent.max)}`
    : `${formatCurrency(property.rentMin)}-${formatCurrency(property.rentMax)} (guess)`;

  const arvGuidance = hasAppraisal
    ? `${formatCurrency(property.arvMin)}-${formatCurrency(property.arvMax)}`
    : undefined;

  const rehabGuidance = hasContractorWalkthrough
    ? `${formatCurrency(effectiveRanges.rehab.min)}-${formatCurrency(effectiveRanges.rehab.max)}`
    : `${formatCurrency(property.rehabMin)}-${formatCurrency(property.rehabMax)} (guess)`;

  const timelineGuidance = hasContractorWalkthrough
    ? `${effectiveRanges.timeline.min}-${effectiveRanges.timeline.max} months`
    : `${property.timelineMin}-${property.timelineMax} months (guess)`;

  // Tax/Insurance guidance based on property value (industry standard: 1-2% for taxes, 0.5-1% for insurance)
  const estimatedTaxes = Math.round(property.price * 0.015); // 1.5% midpoint
  const estimatedInsurance = Math.round(property.price * 0.007); // 0.7% midpoint

  const taxGuidance = `${formatCurrency(Math.round(property.price * 0.01))}-${formatCurrency(Math.round(property.price * 0.02))} (1-2% of value)`;
  const insuranceGuidance = `${formatCurrency(Math.round(property.price * 0.005))}-${formatCurrency(Math.round(property.price * 0.01))} (0.5-1% of value)`;

  const closingCosts = Math.round(property.price * 0.025);
  const allInBasis = property.price + closingCosts + n(inputs.rehabBudget) * (1 + n(inputs.contingencyPct) / 100);

  const leverageLevel = inputs.ltv > 85 ? 'high' : inputs.ltv > 70 ? 'moderate' : 'low';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-2xl md:rounded-2xl shadow-2xl border-t-2 md:border-2 border-blue-500/30 max-w-6xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg md:text-2xl font-bold truncate">{property.name}</h2>
            <p className="text-blue-100 text-xs md:text-sm truncate">Purchase Price: {formatCurrency(property.price)} • bd / ba • {property.sizeSqft} sqft</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-white transition-colors p-3 rounded-full bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 flex-shrink-0 ml-2"
            data-sound="close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Strategy Selector */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-gray-400 text-xs md:text-sm font-semibold">Strategy:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleChange('strategy', 'rent')}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  inputs.strategy === 'rent'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="font-semibold text-sm">Rental</span>
              </button>
              <button
                onClick={() => handleChange('strategy', 'flip')}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                  inputs.strategy === 'flip'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold text-sm">Flip</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fixed Header Row */}
        <div className="hidden md:grid grid-cols-[1fr,1fr,2fr] gap-4 px-4 py-3 bg-slate-700 border-b-2 border-slate-600">
          <div className="text-gray-200 text-xs font-bold uppercase tracking-wider">Field</div>
          <div className="text-gray-200 text-xs font-bold uppercase tracking-wider text-right">Market Data / Guidance</div>
          <div className="text-gray-200 text-xs font-bold uppercase tracking-wider">Your Input</div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarGutter: 'stable' }}>

          {/* SECTION: FINANCING */}
          <div className="mx-3 md:mx-4 mt-3 md:mt-4 rounded-xl border border-amber-500/20 bg-slate-800/30 overflow-hidden">
            <div className="px-4 py-3 md:py-4 bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20">
              <h3 className="text-amber-400 font-bold text-base md:text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financing
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">How much you borrow vs. pay upfront</p>
            </div>

            <FieldRow
              label="Loan-to-Value (LTV)"
              term="ltv"
              rangeGuidance={`${LTV_MIN}% conservative - ${LTV_MAX}% aggressive`}
              rangeColor={leverageLevel === 'low' ? 'green' : leverageLevel === 'moderate' ? 'amber' : 'gray'}
            >
              <SliderInput
                value={inputs.ltv}
                onChange={(v) => handleChange('ltv', v)}
                min={LTV_MIN}
                max={LTV_MAX}
                step={5}
                suffix="%"
                getColor={(v) => v > 85 ? '#ef4444' : v > 70 ? '#f59e0b' : '#10b981'}
              />
            </FieldRow>

            {/* Derived values display */}
            <div className="px-4 py-3 grid grid-cols-3 gap-3 bg-slate-900/50">
              <div className="text-center">
                <div className="text-gray-500 text-xs">Down Payment</div>
                <div className="text-white font-mono text-sm font-semibold">{getDownPaymentFromLTV(inputs.ltv)}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">Interest Rate</div>
                <div className={`font-mono text-sm font-semibold ${inputs.ltv >= 80 ? 'text-amber-400' : 'text-white'}`}>
                  {getInterestRateFromLTV(inputs.ltv).toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">Loan Fees</div>
                <div className={`font-mono text-sm font-semibold ${inputs.ltv >= 80 ? 'text-amber-400' : 'text-white'}`}>
                  {getLoanFeesFromLTV(inputs.ltv).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* SECTION: ACQUISITION & REHAB */}
          <div className="mx-3 md:mx-4 mt-3 md:mt-4 rounded-xl border border-blue-500/20 bg-slate-800/30 overflow-hidden">
            <div className="px-4 py-3 md:py-4 bg-gradient-to-r from-blue-500/10 to-transparent border-b border-blue-500/20">
              <h3 className="text-blue-400 font-bold text-base md:text-lg flex items-center gap-2">
                <Home className="w-5 h-5" />
                Renovation & Costs
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">Your repair budget, permits, and contingency</p>
            </div>

            <FieldRow
              label="Rehab Budget"
              term="rehabBudget"
              rangeGuidance={rehabGuidance}
              rangeColor={hasContractorWalkthrough ? 'green' : 'amber'}
              isLocked={!hasContractorWalkthrough}
              lockMessage="Do walkthrough"
            >
              <TextInput
                value={inputs.rehabBudget}
                onChange={(v) => handleChange('rehabBudget', v)}
                placeholder="Enter amount"
              />
            </FieldRow>

            {/* Finish Level Selector - only show when rehab budget > 0 */}
            {(inputs.rehabBudget ?? 0) > 0 && (
              <div className="px-4 py-3 border-b border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-300 text-sm font-semibold">Finish Level</span>
                  <Popover>
                    <PopoverTrigger>
                      <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                    </PopoverTrigger>
                    <PopoverContent className="bg-slate-800 border-slate-700 text-white text-sm max-w-xs">
                      <p className="font-semibold mb-1">Finish Level</p>
                      <p className="text-gray-300">Luxury finishes cost 40% more but boost rent by 10% and property value by 8%. Builder grade is the safe, budget-friendly choice.</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  {(Object.entries(FINISH_LEVEL_CONFIG) as [string, typeof FINISH_LEVEL_CONFIG['builder']][]).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleChange('finishLevel', key as 'builder' | 'luxury')}
                      className={`flex-1 px-3 py-2 rounded-lg border transition-all text-left ${
                        inputs.finishLevel === key
                          ? key === 'luxury'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10'
                            : 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10'
                          : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
                      }`}
                      data-testid={`button-finish-${key}`}
                    >
                      <div className="font-semibold text-sm">{config.label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{config.description}</div>
                      {key === 'luxury' && inputs.finishLevel === 'luxury' && (
                        <div className="text-xs mt-1 text-amber-400">+40% cost, +10% rent, +8% value</div>
                      )}
                    </button>
                  ))}
                </div>
                {inputs.finishLevel === 'luxury' && (inputs.rehabBudget ?? 0) > 0 && (
                  <div className="mt-2 text-xs text-amber-400/80 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Adjusted rehab cost: {formatCurrency(Math.round((inputs.rehabBudget ?? 0) * FINISH_LEVEL_CONFIG.luxury.costMultiplier))}
                  </div>
                )}
              </div>
            )}

            <FieldRow
              label="Contingency Buffer"
              term="contingencyPct"
              rangeGuidance="10-20% recommended"
              rangeColor={(inputs.contingencyPct ?? 10) >= 10 ? 'green' : 'amber'}
            >
              <SliderInput
                value={inputs.contingencyPct}
                onChange={(v) => handleChange('contingencyPct', v)}
                min={0}
                max={30}
                step={1}
                suffix="%"
                getColor={(v) => v >= 10 ? '#10b981' : '#f59e0b'}
              />
            </FieldRow>

            {/* Permit Costs Info */}
            {(inputs.rehabBudget ?? 0) > 0 && (
              <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Permit & Inspection Fees</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-gray-500 hover:text-gray-300 transition-colors p-1 -m-1" type="button">
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[200]">
                        <p>Building permits, inspection fees, and code compliance costs. Typically 1-3% of rehab budget. Already included in your contingency buffer.</p>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="text-gray-400 text-sm font-mono">
                    ~{formatCurrency(Math.round((inputs.rehabBudget ?? 0) * (inputs.finishLevel === 'luxury' ? FINISH_LEVEL_CONFIG.luxury.costMultiplier : 1) * 0.02))}
                  </span>
                </div>
                <p className="text-gray-600 text-xs mt-1">Included in your contingency buffer above</p>
              </div>
            )}

            {isFlip && (
              <>
                <FieldRow
                  label="Rehab Timeline"
                  term="rehabWeeks"
                  rangeGuidance={timelineGuidance}
                  rangeColor={hasContractorWalkthrough ? 'green' : 'amber'}
                  isLocked={!hasContractorWalkthrough}
                  lockMessage="Do walkthrough"
                >
                  <SliderInput
                    value={inputs.rehabWeeks}
                    onChange={(v) => handleChange('rehabWeeks', v)}
                    min={1}
                    max={24}
                    step={1}
                    suffix="months"
                  />
                </FieldRow>

                <FieldRow
                  label="Selling Costs"
                  term="sellingCostsPct"
                  rangeGuidance="8-10% typical"
                  rangeColor={(inputs.sellingCostsPct ?? 8) >= 7.5 ? 'green' : 'amber'}
                >
                  <SliderInput
                    value={inputs.sellingCostsPct}
                    onChange={(v) => handleChange('sellingCostsPct', v)}
                    min={6}
                    max={12}
                    step={0.5}
                    suffix="%"
                    getColor={(v) => v >= 7.5 ? '#10b981' : '#f59e0b'}
                  />
                </FieldRow>
              </>
            )}
          </div>

          {/* SECTION: RENTAL OPERATIONS (only for rental strategy) */}
          {isRental && (
            <div className="mx-3 md:mx-4 mt-3 md:mt-4 mb-3 md:mb-4 rounded-xl border border-emerald-500/20 bg-slate-800/30 overflow-hidden">
              <div className="px-4 py-3 md:py-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-emerald-500/20">
                <h3 className="text-emerald-400 font-bold text-base md:text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rental Income & Expenses
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">Monthly revenue, operating costs, and cash flow</p>
              </div>

              <FieldRow
                label="Monthly Rent"
                term="expectedRent"
                rangeGuidance={rentGuidance}
                rangeColor={hasMarketStudy ? 'green' : 'amber'}
                isLocked={!hasMarketStudy}
                lockMessage="Do market study"
              >
                <TextInput
                  value={inputs.expectedRent}
                  onChange={(v) => handleChange('expectedRent', v)}
                  placeholder="Enter rent"
                />
              </FieldRow>

              <FieldRow
                label="Vacancy Rate"
                term="vacancyRate"
                rangeGuidance="5-10% typical (2-5 months/year)"
                rangeColor={(inputs.vacancyRate ?? 5) >= 5 ? 'green' : 'amber'}
              >
                <SliderInput
                  value={inputs.vacancyRate}
                  onChange={(v) => handleChange('vacancyRate', v)}
                  min={0}
                  max={20}
                  step={0.5}
                  suffix="%"
                  getColor={(v) => v >= 5 ? '#10b981' : '#f59e0b'}
                />
              </FieldRow>

              <FieldRow
                label="Property Taxes (Annual)"
                term="taxesAnnual"
                rangeGuidance={taxGuidance}
                rangeColor="green"
              >
                <TextInput
                  value={inputs.taxesAnnual}
                  onChange={(v) => handleChange('taxesAnnual', v)}
                  placeholder={formatCurrency(estimatedTaxes)}
                />
              </FieldRow>

              <FieldRow
                label="Insurance (Annual)"
                term="insuranceAnnual"
                rangeGuidance={insuranceGuidance}
                rangeColor="green"
              >
                <TextInput
                  value={inputs.insuranceAnnual}
                  onChange={(v) => handleChange('insuranceAnnual', v)}
                  placeholder={formatCurrency(estimatedInsurance)}
                />
              </FieldRow>

              <FieldRow
                label="Maintenance Reserve"
                term="maintenancePct"
                rangeGuidance="5-10% of rent"
                rangeColor={(inputs.maintenancePct ?? 5) >= 5 ? 'green' : 'amber'}
              >
                <SliderInput
                  value={inputs.maintenancePct}
                  onChange={(v) => handleChange('maintenancePct', v)}
                  min={0}
                  max={15}
                  step={0.5}
                  suffix="%"
                  getColor={(v) => v >= 5 ? '#10b981' : '#f59e0b'}
                />
              </FieldRow>

              <FieldRow
                label="CapEx Reserve"
                term="capExPct"
                rangeGuidance="8-12% of rent (roof, HVAC, etc)"
                rangeColor={(inputs.capExPct ?? 8) >= 8 ? 'green' : 'amber'}
              >
                <SliderInput
                  value={inputs.capExPct}
                  onChange={(v) => handleChange('capExPct', v)}
                  min={0}
                  max={20}
                  step={0.5}
                  suffix="%"
                  getColor={(v) => v >= 8 ? '#10b981' : '#f59e0b'}
                />
              </FieldRow>

              {/* Utilities toggle */}
              <div className="flex flex-col gap-2 py-4 md:py-3 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors px-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm font-medium">Landlord Pays Utilities?</span>
                    <InfoTooltip term="utilities" />
                  </div>
                  <span className="text-gray-500 text-xs">Adds ~$150/mo if yes</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleChange('utilities', true)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                      inputs.utilities === true
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-gray-400'
                    }`}
                  >
                    Yes (you pay)
                  </button>
                  <button
                    onClick={() => handleChange('utilities', false)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                      inputs.utilities === false
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-gray-400'
                    }`}
                  >
                    Tenant pays
                  </button>
                </div>
              </div>

              {inputs.utilities && (
                <FieldRow
                  label="Monthly Utilities Cost"
                  term="utilitiesMonthly"
                  rangeGuidance="$100-$200/mo typical"
                  rangeColor="green"
                >
                  <TextInput
                    value={inputs.utilitiesMonthly}
                    onChange={(v) => handleChange('utilitiesMonthly', v)}
                    placeholder="$150"
                  />
                </FieldRow>
              )}

              {/* Property Management toggle */}
              <div className="flex flex-col gap-2 py-4 md:py-3 border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors px-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 text-sm font-medium">Hire Property Manager?</span>
                    <InfoTooltip term="propertyManagement" />
                  </div>
                  <span className="text-gray-500 text-xs">5% of rent (fixed fee)</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleChange('propertyManagement', true)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                      inputs.propertyManagement === true
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-gray-400'
                    }`}
                  >
                    Yes (5% fee)
                  </button>
                  <button
                    onClick={() => handleChange('propertyManagement', false)}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all text-sm ${
                      inputs.propertyManagement === false
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-slate-800 border-slate-700 text-gray-400'
                    }`}
                  >
                    Self-Manage
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Summary */}
        <div className="border-t-2 border-blue-500/30 bg-gradient-to-r from-slate-900 to-slate-800 px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Key Metrics */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Cash Needed</div>
                <div className="text-white font-mono font-bold text-base md:text-lg">{formatCurrency(liveOutputs.totalCashInvested)}</div>
              </div>

              {isRental && (
                <>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">Monthly Cash Flow</div>
                    <div className={`font-mono font-bold text-base md:text-lg ${liveOutputs.cashFlowMonthly > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {liveOutputs.cashFlowMonthly > 0 ? '+' : ''}{formatCurrency(liveOutputs.cashFlowMonthly)}
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left group" type="button" data-testid="roi-tooltip-rental">
                        <div className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1">
                          Cash-on-Cash
                          <HelpCircle className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        </div>
                        <div className={`font-mono font-bold text-base md:text-lg ${
                          liveOutputs.cashOnCash >= 12 ? 'text-emerald-400' :
                          liveOutputs.cashOnCash >= 8 ? 'text-emerald-400' :
                          liveOutputs.cashOnCash >= 4 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {liveOutputs.cashOnCash.toFixed(1)}%
                          <span className="text-xs ml-1 font-normal opacity-70">
                            {liveOutputs.cashOnCash >= 12 ? 'Great' :
                             liveOutputs.cashOnCash >= 8 ? 'Good' :
                             liveOutputs.cashOnCash >= 4 ? 'OK' : 'Low'}
                          </span>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[200]">
                      <p className="font-semibold mb-1">Cash-on-Cash Return</p>
                      <p className="text-gray-400 text-xs mb-2">Annual cash flow divided by your total cash invested. Shows how hard your money is working.</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 12%+ = Great deal</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400/60" /> 8-12% = Good deal</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> 4-8% = Marginal</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> Under 4% = Risky</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}

              {isFlip && (
                <>
                  <div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">Flip Profit</div>
                    <div className={`font-mono font-bold text-base md:text-lg ${liveOutputs.flipProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {liveOutputs.flipProfit > 0 ? '+' : ''}{formatCurrency(liveOutputs.flipProfit)}
                    </div>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left group" type="button" data-testid="roi-tooltip-flip">
                        <div className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1">
                          Flip ROI
                          <HelpCircle className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                        </div>
                        <div className={`font-mono font-bold text-base md:text-lg ${
                          liveOutputs.flipROI >= 30 ? 'text-emerald-400' :
                          liveOutputs.flipROI >= 15 ? 'text-emerald-400' :
                          liveOutputs.flipROI >= 5 ? 'text-amber-400' :
                          'text-red-400'
                        }`}>
                          {liveOutputs.flipROI.toFixed(1)}%
                          <span className="text-xs ml-1 font-normal opacity-70">
                            {liveOutputs.flipROI >= 30 ? 'Great' :
                             liveOutputs.flipROI >= 15 ? 'Good' :
                             liveOutputs.flipROI >= 5 ? 'OK' : 'Low'}
                          </span>
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[200]">
                      <p className="font-semibold mb-1">Flip Return on Investment</p>
                      <p className="text-gray-400 text-xs mb-2">Your profit divided by cash invested. Higher is better, but watch out for risks.</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 30%+ = Excellent flip</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400/60" /> 15-30% = Solid flip</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> 5-15% = Thin margins</div>
                        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> Under 5% = Probably losing money</div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <button
                onClick={onClose}
                className="w-full md:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                data-sound="close"
              >
                <CheckCircle className="w-5 h-5" />
                Save & Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
