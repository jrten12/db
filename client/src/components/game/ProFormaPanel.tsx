import { useState, useEffect } from 'react';
import { StrategyTabs } from './StrategyTabs';
import { ProFormaInputs, Property, formatCurrency } from '@/lib/gameData';

interface ProFormaPanelProps {
  property: Property;
  inputs: ProFormaInputs;
  onInputsChange: (inputs: ProFormaInputs) => void;
  onCalculate: () => void;
}

export function ProFormaPanel({ property, inputs, onInputsChange, onCalculate }: ProFormaPanelProps) {
  const [localInputs, setLocalInputs] = useState(inputs);

  useEffect(() => {
    setLocalInputs(inputs);
  }, [inputs]);

  const handleChange = <K extends keyof ProFormaInputs>(key: K, value: ProFormaInputs[K]) => {
    const newInputs = { ...localInputs, [key]: value };
    setLocalInputs(newInputs);
    onInputsChange(newInputs);
  };

  const downPaymentAmount = property.price * (localInputs.downPaymentPct / 100);
  const loanAmount = property.price - downPaymentAmount;
  const monthlyRate = localInputs.interestRate / 100 / 12;
  const numPayments = 30 * 12;
  const debtService = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  return (
    <div className="bg-paper paper-texture rounded-lg card-frame overflow-hidden" data-testid="pro-forma-panel">
      <div className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="font-display text-stone-800 text-lg md:text-xl font-semibold tracking-wide">PRO FORMA</h2>
          <div className="text-stone-700 font-serif text-base md:text-lg">
            Property 3: <span className="font-semibold">{property.name}</span>
          </div>
        </div>

        <StrategyTabs 
          strategy={localInputs.strategy} 
          onStrategyChange={(s) => handleChange('strategy', s)} 
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-amber-700 font-semibold text-sm uppercase tracking-wide">Income</h3>
            
            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm font-medium">Expected Rent:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.expectedRent}
                  onChange={(e) => handleChange('expectedRent', Number(e.target.value))}
                  className="game-input w-24 text-right"
                  data-testid="input-expected-rent"
                />
                <span className="text-stone-500 text-sm">/month</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm font-medium">Vacancy Rate:</label>
              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={localInputs.vacancyRate}
                  onChange={(e) => handleChange('vacancyRate', Number(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer slider-track"
                  style={{
                    background: `linear-gradient(to right, hsl(145 55% 40%) 0%, hsl(145 55% 40%) ${localInputs.vacancyRate * 5}%, hsl(30 20% 28%) ${localInputs.vacancyRate * 5}%, hsl(30 20% 28%) 100%)`
                  }}
                  data-testid="input-vacancy-rate"
                />
                <span className="text-stone-700 font-mono text-sm w-10 text-right">{localInputs.vacancyRate}%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-stone-500 font-semibold text-sm uppercase tracking-wide">
              Financing <span className="font-normal capitalize">{localInputs.financingType === 'bank' ? 'Bank Loan' : 'Hard Money'}</span>
            </h3>
            
            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm font-medium">Interest Rate</label>
              <span className="text-stone-800 font-mono">{localInputs.interestRate}%</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm font-medium">Down Payment</label>
              <span className="text-stone-800 font-mono">
                {localInputs.downPaymentPct}% <span className="text-stone-500 text-xs">({formatCurrency(downPaymentAmount)})</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm font-medium">Monthly Debt Service</label>
              <span className="text-stone-800 font-mono font-semibold">{formatCurrency(debtService)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-stone-700 font-semibold text-sm">• Operating Expenses</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Taxes</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.taxesAnnual}
                  onChange={(e) => handleChange('taxesAnnual', Number(e.target.value))}
                  className="game-input w-24 text-right"
                  data-testid="input-taxes"
                />
                <span className="text-stone-500 text-xs">/year</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Insurance</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.insuranceAnnual}
                  onChange={(e) => handleChange('insuranceAnnual', Number(e.target.value))}
                  className="game-input w-24 text-right"
                  data-testid="input-insurance"
                />
                <span className="text-stone-500 text-xs">/year</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Maintenance</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.maintenancePct}
                  onChange={(e) => handleChange('maintenancePct', Number(e.target.value))}
                  className="game-input w-16 text-right"
                  data-testid="input-maintenance"
                />
                <span className="text-stone-500 text-xs">% of Rent</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Property Management</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChange('propertyManagement', !localInputs.propertyManagement)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    localInputs.propertyManagement 
                      ? 'bg-success' 
                      : 'bg-stone-300'
                  }`}
                  data-testid="toggle-property-mgmt"
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    localInputs.propertyManagement ? 'left-6' : 'left-0.5'
                  }`} />
                </button>
                <span className="text-stone-600 text-xs font-mono">
                  {localInputs.propertyManagement ? `${localInputs.propertyManagementPct}%` : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-stone-700 font-semibold text-sm">• Rehab & Timeline</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Rehab Budget</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.rehabBudget}
                  onChange={(e) => handleChange('rehabBudget', Number(e.target.value))}
                  className="game-input w-28 text-right"
                  data-testid="input-rehab-budget"
                />
                <span className="text-stone-500 text-xs invisible sm:visible">/total</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Rehab Duration</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.rehabWeeks}
                  onChange={(e) => handleChange('rehabWeeks', Number(e.target.value))}
                  className="game-input w-16 text-right"
                  data-testid="input-rehab-weeks"
                />
                <span className="text-stone-500 text-xs">Weeks</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Contingency</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localInputs.contingencyPct}
                  onChange={(e) => handleChange('contingencyPct', Number(e.target.value))}
                  className="game-input w-16 text-right"
                  data-testid="input-contingency"
                />
                <span className="text-stone-500 text-xs">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-stone-700 text-sm">Contingency</label>
              <span className="text-stone-600 font-mono text-sm">{localInputs.contingencyPct}%</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={onCalculate}
            className="game-button w-full text-base"
            data-testid="button-calculate"
          >
            Calculate Cash Flow
          </button>
        </div>
      </div>
    </div>
  );
}