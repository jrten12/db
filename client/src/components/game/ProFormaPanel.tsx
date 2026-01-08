import { useState, useMemo } from 'react';
import { ProFormaInputs, ProFormaOutputs, formatCurrency, calculateProForma } from '@/lib/gameData';
import { Building2, Landmark, TrendingUp, Clock, AlertTriangle, DollarSign, Percent, Home, Zap, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Property } from '@shared/schema';

const TERM_DEFINITIONS: Record<string, string> = {
  purchasePrice: "The price you're paying to buy the property. This is your starting point for all calculations.",
  closingCosts: "Fees paid when the sale is finalized - includes title insurance, attorney fees, recording fees, etc. Typically 2-4% of purchase price.",
  rehabBudget: "The money you plan to spend fixing up the property - repairs, renovations, upgrades.",
  contingency: "Extra buffer for unexpected costs. Things always cost more than expected! 10-20% is common.",
  allInBasis: "Your total investment in the property: purchase price + closing costs + rehab + contingency. This is what you need to beat to make money.",
  arv: "After Repair Value - what the property will be worth after you fix it up. Critical for flip deals.",
  downPayment: "Cash you put in upfront. The rest comes from your lender. Higher down payment = lower monthly payments but more cash tied up.",
  interestRate: "The yearly cost of borrowing money, expressed as a percentage. Hard money is higher (10-14%), banks are lower (6-8%).",
  loanTerm: "How long you have to pay back the loan. Longer terms = lower monthly payments but more interest paid overall.",
  financingType: "Hard money: faster approval, higher rates, good for flips. Bank loan: slower, cheaper, better for rentals.",
  expectedRent: "What you think tenants will pay monthly. Be conservative - it's better to be pleasantly surprised.",
  vacancyRate: "Percentage of time the property sits empty between tenants. 5-10% is typical - that's about 2-5 weeks per year.",
  taxesAnnual: "Yearly property taxes. Check the county assessor's website for exact amounts.",
  insuranceAnnual: "Yearly insurance premium. Landlord policies cost more than regular homeowner's insurance.",
  maintenancePct: "Ongoing repair costs as a percentage of rent. Budget 5-10% for maintenance reserves.",
  propertyManagement: "Hiring someone to handle tenants, repairs, and day-to-day operations. Typically 8-10% of rent.",
  rehabWeeks: "How long the renovation will take. Add buffer time - contractors are almost never early.",
  holdingCosts: "Costs you pay while owning the property: loan payments, taxes, insurance, utilities. These add up fast during rehab!",
  cashOnCash: "Your annual cash flow divided by cash invested. A 10% cash-on-cash means you earn 10 cents per year for every dollar invested.",
  capRate: "Net Operating Income divided by property value. Helps compare deals regardless of financing. Higher = better return.",
  cashFlow: "Money left over after all expenses and mortgage are paid. Positive = you're making money each month.",
  roi: "Return on Investment - your profit divided by cash invested. For flips, aim for 20%+ to account for risk.",
  flipProfit: "ARV minus all your costs (purchase + closing + rehab + holding). What's left is your profit.",
};

function InfoTooltip({ term }: { term: keyof typeof TERM_DEFINITIONS }) {
  const definition = TERM_DEFINITIONS[term];
  if (!definition) return null;
  
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="ml-1 text-gray-500 hover:text-gray-300 transition-colors" type="button">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3">
          <p>{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ProFormaPanelProps {
  property: Property & { rentRange: [number, number] };
  inputs: ProFormaInputs;
  onInputsChange: (inputs: ProFormaInputs) => void;
  onCalculate: () => void;
}

export function ProFormaPanel({ property, inputs, onInputsChange, onCalculate }: ProFormaPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    foundation: true,
    capital: true,
    operations: true,
    timeline: true,
  });

  const handleChange = <K extends keyof ProFormaInputs>(key: K, value: ProFormaInputs[K]) => {
    onInputsChange({ ...inputs, [key]: value });
  };

  const closingCosts = Math.round(property.price * 0.03);
  const allInBasis = property.price + closingCosts + inputs.rehabBudget * (1 + inputs.contingencyPct / 100);
  
  const liveOutputs = useMemo(() => {
    return calculateProForma(inputs, property);
  }, [inputs, property]);

  const effectiveRent = inputs.expectedRent * (1 - inputs.vacancyRate / 100);
  const monthlyExpenses = (inputs.taxesAnnual / 12) + (inputs.insuranceAnnual / 12) + 
    (inputs.expectedRent * inputs.maintenancePct / 100) +
    (inputs.propertyManagement ? inputs.expectedRent * inputs.propertyManagementPct / 100 : 0);
  
  const leverageRatio = (100 - inputs.downPaymentPct) / 100;
  const leverageLevel = leverageRatio > 0.85 ? 'high' : leverageRatio > 0.7 ? 'moderate' : 'low';
  
  const holdingCostPerWeek = Math.round((property.price * (inputs.interestRate / 100) / 52) + 
    (inputs.taxesAnnual / 52) + (inputs.insuranceAnnual / 52));

  const arvMid = (property.arvMin + property.arvMax) / 2;
  const flipProfit = arvMid - allInBasis - (holdingCostPerWeek * inputs.rehabWeeks);
  const flipROI = liveOutputs.totalCashInvested > 0 ? (flipProfit / liveOutputs.totalCashInvested) * 100 : 0;

  const isViable = inputs.strategy === 'rent' 
    ? liveOutputs.cashFlowMonthly > 0 
    : flipProfit > 0;
  
  const fragility = inputs.strategy === 'rent'
    ? (inputs.expectedRent - property.rentRange[0] < 150 ? 'low' : 
       inputs.vacancyRate < 5 ? 'high' : 
       inputs.contingencyPct < 10 ? 'high' : 'moderate')
    : (inputs.contingencyPct < 10 ? 'high' : 
       inputs.rehabWeeks > property.timelineMin * 1.5 ? 'moderate' : 'low');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" data-testid="pro-forma-panel">
      <div className="xl:col-span-2 space-y-4">
        {/* STRATEGY SELECTOR */}
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 p-4">
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

        {/* LAYER 1: DEAL FOUNDATION */}
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('foundation')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm">Deal Foundation</h3>
                <p className="text-gray-500 text-xs">Your total investment basis</p>
              </div>
            </div>
            {expandedSections.foundation ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {expandedSections.foundation && (
            <div className="px-4 pb-4 space-y-4">
              {inputs.strategy === 'rent' ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Purchase Price<InfoTooltip term="purchasePrice" /></div>
                      <div className="text-white text-lg font-bold font-mono">{formatCurrency(property.price)}</div>
                      <div className="text-gray-500 text-xs">Fixed</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Closing Costs<InfoTooltip term="closingCosts" /></div>
                      <div className="text-white text-lg font-bold font-mono">{formatCurrency(closingCosts)}</div>
                      <div className="text-gray-500 text-xs">~3% estimate</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Rehab + Contingency<InfoTooltip term="contingency" /></div>
                      <div className="text-white text-lg font-bold font-mono">
                        {formatCurrency(inputs.rehabBudget * (1 + inputs.contingencyPct / 100))}
                      </div>
                      <div className="text-gray-500 text-xs">Your estimate</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider flex items-center">All-In Basis<InfoTooltip term="allInBasis" /></div>
                        <div className="text-white text-2xl font-bold font-mono mt-1">{formatCurrency(allInBasis)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-400 text-xs">Price per sqft</div>
                        <div className="text-gray-300 font-mono">{formatCurrency(Math.round(allInBasis / property.sizeSqft))}/sqft</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Purchase Price<InfoTooltip term="purchasePrice" /></div>
                      <div className="text-white text-lg font-bold font-mono">{formatCurrency(property.price)}</div>
                      <div className="text-gray-500 text-xs">Your acquisition cost</div>
                    </div>
                    <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
                      <div className="text-amber-400 text-xs mb-1 flex items-center">ARV (After Repair Value)<InfoTooltip term="arv" /></div>
                      <div className="text-amber-300 text-lg font-bold font-mono">
                        {formatCurrency(property.arvMin)} - {formatCurrency(property.arvMax)}
                      </div>
                      <div className="text-amber-500/70 text-xs">Expected sale price</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Closing Costs<InfoTooltip term="closingCosts" /></div>
                      <div className="text-white font-bold font-mono">{formatCurrency(closingCosts)}</div>
                      <div className="text-gray-500 text-xs">~3% estimate</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Rehab Budget<InfoTooltip term="rehabBudget" /></div>
                      <div className="text-white font-bold font-mono">{formatCurrency(inputs.rehabBudget)}</div>
                      <div className="text-gray-500 text-xs">Your estimate</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                      <div className="text-gray-400 text-xs mb-1 flex items-center">Contingency ({inputs.contingencyPct}%)<InfoTooltip term="contingency" /></div>
                      <div className="text-white font-bold font-mono">{formatCurrency(Math.round(inputs.rehabBudget * inputs.contingencyPct / 100))}</div>
                      <div className="text-gray-500 text-xs">Buffer for surprises</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-r from-blue-500/20 to-slate-800/50 rounded-xl p-4 border border-blue-500/30">
                      <div className="text-blue-400 text-xs font-semibold uppercase tracking-wider">All-In Basis</div>
                      <div className="text-white text-xl font-bold font-mono mt-1">{formatCurrency(allInBasis)}</div>
                      <div className="text-gray-500 text-xs mt-1">Total cost to acquire & fix</div>
                    </div>
                    <div className={`bg-gradient-to-r rounded-xl p-4 border ${flipProfit > 0 ? 'from-emerald-500/20 to-slate-800/50 border-emerald-500/30' : 'from-red-500/20 to-slate-800/50 border-red-500/30'}`}>
                      <div className={`text-xs font-semibold uppercase tracking-wider ${flipProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>Projected Profit</div>
                      <div className={`text-xl font-bold font-mono mt-1 ${flipProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {flipProfit > 0 ? '' : '-'}{formatCurrency(Math.abs(flipProfit))}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">ARV mid - All-in - Holding</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* LAYER 2: CAPITAL STACK */}
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('capital')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Landmark className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm">Capital Stack</h3>
                <p className="text-gray-500 text-xs">How you're financing this deal</p>
              </div>
            </div>
            {expandedSections.capital ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {expandedSections.capital && (
            <div className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    handleChange('financingType', 'bank');
                    handleChange('interestRate', 5);
                    handleChange('downPaymentPct', 25);
                  }}
                  className={`p-3 rounded-xl border transition-all ${
                    inputs.financingType === 'bank'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
                  }`}
                  data-testid="button-financing-bank"
                >
                  <div className="font-semibold text-sm">Conventional</div>
                  <div className="text-xs opacity-70">25% down, 5% rate</div>
                </button>
                <button
                  onClick={() => {
                    handleChange('financingType', 'hard-money');
                    handleChange('interestRate', 12);
                    handleChange('downPaymentPct', 10);
                  }}
                  className={`p-3 rounded-xl border transition-all ${
                    inputs.financingType === 'hard-money'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                      : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
                  }`}
                  data-testid="button-financing-hard-money"
                >
                  <div className="font-semibold text-sm">Hard Money</div>
                  <div className="text-xs opacity-70">10% down, 12% rate</div>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-xs flex items-center">Loan-to-Value (LTV)<InfoTooltip term="downPayment" /></span>
                    <span className="text-white font-mono text-sm">{100 - inputs.downPaymentPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={100 - inputs.downPaymentPct}
                    onChange={(e) => handleChange('downPaymentPct', 100 - Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${leverageLevel === 'high' ? '#ef4444' : leverageLevel === 'moderate' ? '#f59e0b' : '#10b981'} 0%, ${leverageLevel === 'high' ? '#ef4444' : leverageLevel === 'moderate' ? '#f59e0b' : '#10b981'} ${(100 - inputs.downPaymentPct - 50) * 2.22}%, #334155 ${(100 - inputs.downPaymentPct - 50) * 2.22}%, #334155 100%)`
                    }}
                    data-testid="input-ltv"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center">Interest Rate<InfoTooltip term="interestRate" /></span>
                  <span className="text-white font-mono">{inputs.interestRate}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Cash at Close</div>
                  <div className="text-white font-bold font-mono">{formatCurrency(liveOutputs.downPaymentAmount)}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-500 text-xs">Monthly Debt Service</div>
                  <div className="text-red-400 font-bold font-mono">-{formatCurrency(liveOutputs.debtServiceMonthly)}</div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Leverage Level</span>
                  <span className={`text-xs font-semibold ${
                    leverageLevel === 'high' ? 'text-red-400' : leverageLevel === 'moderate' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{leverageLevel.toUpperCase()}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      leverageLevel === 'high' ? 'bg-red-500' : leverageLevel === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${leverageRatio * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LAYER 3: OPERATING ASSUMPTIONS */}
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('operations')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm">Operating Assumptions</h3>
                <p className="text-gray-500 text-xs">Income and expenses</p>
              </div>
            </div>
            {expandedSections.operations ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {expandedSections.operations && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs flex items-center">Market Rent<InfoTooltip term="expectedRent" /></span>
                  <span className="text-white font-mono text-sm">{formatCurrency(inputs.expectedRent)}/mo</span>
                </div>
                <input
                  type="range"
                  min={property.rentRange[0]}
                  max={property.rentRange[1]}
                  value={inputs.expectedRent}
                  onChange={(e) => handleChange('expectedRent', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${((inputs.expectedRent - property.rentRange[0]) / (property.rentRange[1] - property.rentRange[0])) * 100}%, #334155 ${((inputs.expectedRent - property.rentRange[0]) / (property.rentRange[1] - property.rentRange[0])) * 100}%, #334155 100%)`
                  }}
                  data-testid="input-expected-rent"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatCurrency(property.rentRange[0])}</span>
                  <span>{formatCurrency(property.rentRange[1])}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs flex items-center">Vacancy Rate<InfoTooltip term="vacancyRate" /></span>
                  <span className="text-white font-mono text-sm">{inputs.vacancyRate}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={inputs.vacancyRate}
                  onChange={(e) => handleChange('vacancyRate', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${inputs.vacancyRate * 5}%, #334155 ${inputs.vacancyRate * 5}%, #334155 100%)`
                  }}
                  data-testid="input-vacancy-rate"
                />
              </div>

              {/* NOI Flow Visualization */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="text-gray-400 text-xs mb-3">Income to NOI Flow</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs text-gray-400">Gross Rent</div>
                    <div className="flex-1 h-4 bg-emerald-500/30 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                    </div>
                    <div className="w-20 text-right text-xs text-emerald-400 font-mono">{formatCurrency(inputs.expectedRent)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs text-gray-400">- Vacancy</div>
                    <div className="flex-1 h-4 bg-red-500/30 rounded overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${inputs.vacancyRate * 5}%` }} />
                    </div>
                    <div className="w-20 text-right text-xs text-red-400 font-mono">-{formatCurrency(inputs.expectedRent * inputs.vacancyRate / 100)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 text-xs text-gray-400">- Expenses</div>
                    <div className="flex-1 h-4 bg-amber-500/30 rounded overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(monthlyExpenses / inputs.expectedRent) * 100}%` }} />
                    </div>
                    <div className="w-20 text-right text-xs text-amber-400 font-mono">-{formatCurrency(monthlyExpenses)}</div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <div className="w-24 text-xs text-white font-semibold">= NOI</div>
                    <div className="flex-1 h-5 bg-blue-500/30 rounded overflow-hidden">
                      <div className={`h-full ${liveOutputs.noiMonthly > 0 ? 'bg-blue-500' : 'bg-red-500'}`} 
                        style={{ width: `${Math.min(100, Math.max(0, (liveOutputs.noiMonthly / inputs.expectedRent) * 100))}%` }} />
                    </div>
                    <div className={`w-20 text-right text-sm font-bold font-mono ${liveOutputs.noiMonthly > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {formatCurrency(liveOutputs.noiMonthly)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs flex items-center">Taxes (annual)<InfoTooltip term="taxesAnnual" /></label>
                  <input
                    type="number"
                    value={inputs.taxesAnnual}
                    onChange={(e) => handleChange('taxesAnnual', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    data-testid="input-taxes"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs flex items-center">Insurance (annual)<InfoTooltip term="insuranceAnnual" /></label>
                  <input
                    type="number"
                    value={inputs.insuranceAnnual}
                    onChange={(e) => handleChange('insuranceAnnual', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    data-testid="input-insurance"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs flex items-center">Maintenance (%)<InfoTooltip term="maintenancePct" /></label>
                  <input
                    type="number"
                    value={inputs.maintenancePct}
                    onChange={(e) => handleChange('maintenancePct', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    data-testid="input-maintenance"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs flex items-center">Property Mgmt<InfoTooltip term="propertyManagement" /></label>
                  <button
                    onClick={() => handleChange('propertyManagement', !inputs.propertyManagement)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      inputs.propertyManagement
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
                        : 'bg-slate-800 border border-slate-700 text-gray-400'
                    }`}
                    data-testid="toggle-property-mgmt"
                  >
                    {inputs.propertyManagement ? `ON (${inputs.propertyManagementPct}%)` : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LAYER 4: TIMELINE & RISK */}
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 overflow-hidden">
          <button 
            onClick={() => toggleSection('timeline')}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-semibold text-sm">Time & Risk</h3>
                <p className="text-gray-500 text-xs">Rehab timeline and contingencies</p>
              </div>
            </div>
            {expandedSections.timeline ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          
          {expandedSections.timeline && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Rehab Budget</span>
                  <span className="text-white font-mono text-sm">{formatCurrency(inputs.rehabBudget)}</span>
                </div>
                <input
                  type="range"
                  min={property.rehabMin}
                  max={property.rehabMax}
                  value={inputs.rehabBudget}
                  onChange={(e) => handleChange('rehabBudget', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((inputs.rehabBudget - property.rehabMin) / (property.rehabMax - property.rehabMin)) * 100}%, #334155 ${((inputs.rehabBudget - property.rehabMin) / (property.rehabMax - property.rehabMin)) * 100}%, #334155 100%)`
                  }}
                  data-testid="input-rehab-budget"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{formatCurrency(property.rehabMin)}</span>
                  <span>{formatCurrency(property.rehabMax)}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Rehab Duration</span>
                  <span className="text-white font-mono text-sm">{inputs.rehabWeeks} weeks</span>
                </div>
                <input
                  type="range"
                  min={property.timelineMin}
                  max={property.timelineMax}
                  value={inputs.rehabWeeks}
                  onChange={(e) => handleChange('rehabWeeks', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${((inputs.rehabWeeks - property.timelineMin) / (property.timelineMax - property.timelineMin)) * 100}%, #334155 ${((inputs.rehabWeeks - property.timelineMin) / (property.timelineMax - property.timelineMin)) * 100}%, #334155 100%)`
                  }}
                  data-testid="input-rehab-weeks"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{property.timelineMin}w</span>
                  <span>{property.timelineMax}w</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Contingency</span>
                  <span className="text-white font-mono text-sm">{inputs.contingencyPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={inputs.contingencyPct}
                  onChange={(e) => handleChange('contingencyPct', Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${inputs.contingencyPct * 4}%, #334155 ${inputs.contingencyPct * 4}%, #334155 100%)`
                  }}
                  data-testid="input-contingency"
                />
              </div>

              {/* Timeline Bar */}
              <div className="bg-slate-800/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">Holding Cost Burn</span>
                  <span className="text-red-400 text-xs font-mono">{formatCurrency(holdingCostPerWeek)}/week</span>
                </div>
                <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden">
                  {Array.from({ length: inputs.rehabWeeks }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full bg-red-500/80 border-r border-slate-700"
                      style={{ 
                        left: `${(i / Math.max(property.timelineMax, inputs.rehabWeeks)) * 100}%`,
                        width: `${100 / Math.max(property.timelineMax, inputs.rehabWeeks)}%`
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 text-xs">Total holding costs:</span>
                  <span className="text-red-400 font-mono text-sm font-semibold">
                    {formatCurrency(holdingCostPerWeek * inputs.rehabWeeks)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LAYER 5: LIVE OUTCOMES */}
      <div className="xl:col-span-1">
        <div className="bg-slate-900/90 backdrop-blur rounded-xl border border-slate-700 p-4 sticky top-4">
          <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Live Outcomes
          </h3>

          <div className="space-y-4">
            {/* Primary Outcome - Strategy Specific */}
            {inputs.strategy === 'rent' ? (
              <div className={`rounded-xl p-4 ${isViable ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider ${isViable ? 'text-emerald-400' : 'text-red-400'}`}>
                  Monthly Cash Flow
                </div>
                <div className={`text-3xl font-bold font-mono mt-1 ${isViable ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(liveOutputs.cashFlowMonthly)}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {isViable ? 'Positive cash flow' : 'Negative cash flow'}
                </div>
              </div>
            ) : (
              <div className={`rounded-xl p-4 ${isViable ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                <div className={`text-xs font-semibold uppercase tracking-wider ${isViable ? 'text-amber-400' : 'text-red-400'}`}>
                  Estimated Flip Profit
                </div>
                <div className={`text-3xl font-bold font-mono mt-1 ${isViable ? 'text-amber-400' : 'text-red-400'}`}>
                  {formatCurrency(flipProfit)}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  ARV: {formatCurrency(arvMid)} - Basis: {formatCurrency(allInBasis)}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {inputs.strategy === 'rent' ? (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">Cash-on-Cash</div>
                    <div className={`text-lg font-bold font-mono ${liveOutputs.cashOnCash > 8 ? 'text-emerald-400' : liveOutputs.cashOnCash > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {liveOutputs.cashOnCash.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">Cap Rate</div>
                    <div className={`text-lg font-bold font-mono ${liveOutputs.capRate > 6 ? 'text-emerald-400' : liveOutputs.capRate > 4 ? 'text-amber-400' : 'text-red-400'}`}>
                      {liveOutputs.capRate.toFixed(1)}%
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-3">
                    <div className="text-gray-400 text-xs">ROI</div>
                    <div className={`text-lg font-bold font-mono ${flipROI > 20 ? 'text-emerald-400' : flipROI > 10 ? 'text-amber-400' : 'text-red-400'}`}>
                      {flipROI.toFixed(1)}%
                    </div>
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
              <div className="text-gray-400 text-xs mb-1">Total Cash Invested</div>
              <div className="text-white font-bold font-mono text-lg">{formatCurrency(liveOutputs.totalCashInvested)}</div>
            </div>

            {/* Fragility Warnings */}
            {(fragility !== 'low' || !isViable) && (
              <div className={`rounded-xl p-3 ${fragility === 'high' || !isViable ? 'bg-red-500/20 border border-red-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`w-4 h-4 mt-0.5 ${fragility === 'high' || !isViable ? 'text-red-400' : 'text-amber-400'}`} />
                  <div>
                    <div className={`text-xs font-semibold ${fragility === 'high' || !isViable ? 'text-red-400' : 'text-amber-400'}`}>
                      {!isViable ? 'Deal Fails' : 'Fragility Warning'}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {!isViable && inputs.strategy === 'rent' && 'Expenses exceed income. Adjust assumptions.'}
                      {!isViable && inputs.strategy === 'flip' && 'All-in basis exceeds ARV. This deal loses money.'}
                      {isViable && fragility === 'high' && inputs.vacancyRate < 5 && inputs.strategy === 'rent' && 'Low vacancy assumption. One bad tenant breaks this deal.'}
                      {isViable && fragility === 'high' && inputs.contingencyPct < 10 && 'Low contingency. Unexpected repairs will hurt.'}
                      {isViable && fragility === 'moderate' && inputs.strategy === 'rent' && `A rent miss of ${formatCurrency(150)} flips the outcome.`}
                      {isViable && fragility === 'moderate' && inputs.strategy === 'flip' && 'Timeline delays add holding costs. Budget extra time.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={onCalculate}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                isViable
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-700 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isViable}
              data-testid="button-calculate"
            >
              {isViable ? 'Lock In Pro Forma' : 'Fix Issues First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}