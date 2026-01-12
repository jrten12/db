import { useMemo } from 'react';
import { ArrowDown, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';

interface FlowNode {
  id: string;
  label: string;
  value: number | string;
  type: 'input' | 'calculated' | 'output';
  color: 'blue' | 'emerald' | 'amber' | 'red' | 'gray';
  subtext?: string;
}

interface FormulaCanvasProps {
  strategy: 'rent' | 'flip';
  nodes: {
    purchasePrice: number;
    closingCosts: number;
    rehabBudget: number;
    contingency: number;
    totalBasis: number;
    rent?: number;
    vacancy?: number;
    effectiveRent?: number;
    expenses?: number;
    noi?: number;
    debtService?: number;
    cashFlow?: number;
    arv?: number;
    sellingCosts?: number;
    holdingCosts?: number;
    profit?: number;
    roi?: number;
    cashOnCash?: number;
  };
}

function FlowBox({ 
  label, 
  value, 
  type, 
  color, 
  subtext,
  isPositive,
  isNegative 
}: FlowNode & { isPositive?: boolean; isNegative?: boolean }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    amber: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    red: 'bg-red-500/20 border-red-500/50 text-red-400',
    gray: 'bg-slate-700/50 border-slate-600 text-gray-400',
  };

  return (
    <div className={`rounded-lg p-2 border ${colorClasses[color]} transition-all`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70 truncate">{label}</div>
      <div className="font-bold font-mono text-sm flex items-center gap-1">
        {typeof value === 'number' ? (
          isNegative ? `-${formatCurrency(Math.abs(value))}` : formatCurrency(value)
        ) : value}
        {isPositive && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {isNegative && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>
      {subtext && <div className="text-[9px] opacity-50 mt-0.5">{subtext}</div>}
    </div>
  );
}

function FlowArrow({ direction = 'down', label }: { direction?: 'down' | 'right'; label?: string }) {
  if (direction === 'right') {
    return (
      <div className="flex items-center justify-center px-1">
        <ArrowRight className="w-4 h-4 text-gray-500" />
        {label && <span className="text-[9px] text-gray-500 ml-1">{label}</span>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center py-1">
      <ArrowDown className="w-4 h-4 text-gray-500" />
      {label && <span className="text-[9px] text-gray-500">{label}</span>}
    </div>
  );
}

function OperatorBadge({ op }: { op: '+' | '-' | '×' | '=' }) {
  const colors = {
    '+': 'bg-emerald-500/30 text-emerald-400',
    '-': 'bg-red-500/30 text-red-400',
    '×': 'bg-blue-500/30 text-blue-400',
    '=': 'bg-amber-500/30 text-amber-400',
  };
  return (
    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${colors[op]}`}>
      {op}
    </span>
  );
}

export function FormulaCanvas({ strategy, nodes }: FormulaCanvasProps) {
  if (strategy === 'rent') {
    return (
      <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          How Your Numbers Flow
        </h4>
        
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-1 items-center">
            <FlowBox id="purchase" label="Purchase" value={nodes.purchasePrice} type="input" color="gray" />
            <OperatorBadge op="+" />
            <FlowBox id="rehab" label="Rehab" value={nodes.rehabBudget} type="input" color="gray" />
            <FlowBox id="basis" label="= Total Basis" value={nodes.totalBasis} type="calculated" color="blue" />
          </div>
          
          <div className="border-t border-slate-700/50 pt-2">
            <p className="text-[10px] text-gray-500 mb-2">INCOME SIDE</p>
            <div className="grid grid-cols-4 gap-1 items-center">
              <FlowBox id="rent" label="Rent/mo" value={nodes.rent ?? 0} type="input" color="emerald" />
              <OperatorBadge op="×" />
              <FlowBox id="vacancy" label={`${100 - (nodes.vacancy ?? 5)}% Occupied`} value={`-${nodes.vacancy ?? 5}%`} type="input" color="amber" />
              <FlowBox id="effectiveRent" label="= Effective" value={(nodes.effectiveRent ?? 0)} type="calculated" color="emerald" subtext="/mo" />
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 pt-2">
            <p className="text-[10px] text-gray-500 mb-2">EXPENSE SIDE</p>
            <div className="grid grid-cols-2 gap-1">
              <FlowBox id="expenses" label="Monthly Expenses" value={nodes.expenses ?? 0} type="input" color="red" subtext="taxes+ins+maint" />
              <FlowBox id="noi" label="NOI (Net Op Income)" value={((nodes.effectiveRent ?? 0) - (nodes.expenses ?? 0)) * 12} type="calculated" color="blue" subtext="/year" />
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 pt-2">
            <p className="text-[10px] text-gray-500 mb-2">BOTTOM LINE</p>
            <div className="grid grid-cols-3 gap-1 items-center">
              <FlowBox id="effective" label="Eff. Rent" value={nodes.effectiveRent ?? 0} type="calculated" color="emerald" subtext="/mo" />
              <OperatorBadge op="-" />
              <FlowBox id="debtService" label="Mortgage" value={nodes.debtService ?? 0} type="input" color="red" subtext="/mo" />
            </div>
            <FlowArrow direction="down" />
            <div className={`rounded-xl p-3 border ${(nodes.cashFlow ?? 0) > 0 ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-500/20 border-red-500'}`}>
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-wider text-gray-400">Monthly Cash Flow</div>
                <div className={`text-xl font-bold font-mono ${(nodes.cashFlow ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(nodes.cashFlow ?? 0) > 0 ? '+' : ''}{formatCurrency(nodes.cashFlow ?? 0)}/mo
                </div>
                {nodes.cashOnCash !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">
                    Cash-on-Cash: <span className={`font-mono ${(nodes.cashOnCash ?? 0) >= 8 ? 'text-emerald-400' : 'text-amber-400'}`}>{nodes.cashOnCash?.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-4 space-y-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Flip Profit Breakdown
      </h4>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <FlowBox id="arv" label="After Repair Value" value={nodes.arv ?? 0} type="input" color="emerald" subtext="What you'll sell for" />
          <FlowBox id="basis" label="Total Investment" value={nodes.totalBasis} type="calculated" color="blue" subtext="All-in cost" />
        </div>
        
        <FlowArrow direction="down" label="subtract costs" />
        
        <div className="grid grid-cols-3 gap-1">
          <FlowBox id="selling" label="Selling Costs" value={nodes.sellingCosts ?? 0} type="input" color="red" subtext="~8% of ARV" isNegative />
          <FlowBox id="holding" label="Holding Costs" value={nodes.holdingCosts ?? 0} type="input" color="red" subtext="While renovating" isNegative />
          <FlowBox id="basis2" label="Total Invested" value={nodes.totalBasis} type="calculated" color="blue" isNegative />
        </div>
        
        <FlowArrow direction="down" label="equals" />
        
        <div className={`rounded-xl p-3 border ${(nodes.profit ?? 0) > 0 ? 'bg-emerald-500/20 border-emerald-500' : 'bg-red-500/20 border-red-500'}`}>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">Net Profit</div>
            <div className={`text-xl font-bold font-mono ${(nodes.profit ?? 0) > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {(nodes.profit ?? 0) > 0 ? '+' : ''}{formatCurrency(nodes.profit ?? 0)}
            </div>
            {nodes.roi !== undefined && (
              <div className="text-xs text-gray-400 mt-1">
                ROI: <span className={`font-mono ${(nodes.roi ?? 0) >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{nodes.roi?.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniFormula({ 
  inputs, 
  operation, 
  output,
  outputLabel 
}: { 
  inputs: Array<{ label: string; value: number | string }>; 
  operation: '+' | '-' | '×' | '=';
  output: number | string;
  outputLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-800/30 rounded-lg border border-slate-700/50 text-xs overflow-x-auto">
      {inputs.map((input, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <span className="text-gray-500">{operation}</span>}
          <span className="text-gray-400">{input.label}:</span>
          <span className="text-white font-mono">{typeof input.value === 'number' ? formatCurrency(input.value) : input.value}</span>
        </span>
      ))}
      <span className="text-blue-400 font-bold">=</span>
      <span className="text-blue-400 font-medium">{outputLabel}:</span>
      <span className="text-blue-400 font-bold font-mono">{typeof output === 'number' ? formatCurrency(output) : output}</span>
    </div>
  );
}
